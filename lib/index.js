var _ = require('underscore');
var analyzer = require('sql-analyzer');
var strformat = require('strformat');
var handlebars = require('handlebars');
var path = require('path');
var fs = require('fs');
var jpath = require('jpath');
var os = require("os");
/*
	options = {
		//建表的sql列表
		createSql: [],
		//可以指定sqlite的路径
		sqlitePath: "",
		//是否允许出现下划线，如果不允许，则将user_name转换为userName
		allowUnderscore: false,
	}
 */

var entityMaker = function(saveTo, options){
	this.dothFile = "template-h.handlebars";
	this.dotmFile = "template-m.handlebars";
	//保存到文件夹，默认保存到当前目录
	this.saveToFolder = saveTo || path.join(os.tmpdir(), "peaksqlite-entity");
	if(!fs.existsSync(this.saveToFolder)){
		//文件夹不存在，创建一个
		fs.mkdirSync(this.saveToFolder, 0755);
	}

	this.options = _.extend({
		allowUnderscore: false,
		//类名的格式化
		classFormatter: '{0}Entity'
	}, options);

	//sqlite与cocoa数据类型的影射
	this.mapping = {
		'boolean': {
			cocoaType: 'BOOL',
			//将参数压入到NSArray时的转换
			parameter: '[NSNumber numberWithBool: self.{0}]',
			//从dict中转换转换到cocoa的属性
			parse: '[[self.data objectForKey:@"{0}"] boolValue]',
			defaultValue: 'NO'
		},
		//pointer：是否为指针
		'text': {
			cocoaType: 'NSString',
			pointer: true,
			parameter: '[PeakSqlite nilFilter: self.{0}]',
			parse: '[PeakSqlite valueToString: [data objectForKey:@"{0}"]]',
			defaultValue: 'nil'
		},
		'integer': {
			cocoaType: 'NSInteger',
			parameter: '[NSNumber numberWithInt: self.{0}]',
			parse: '[[data objectForKey:@"{0}"] intValue]',
			defaultValue: '0'
		},
		'float': {
			cocoaType: 'double',
			parameter: '[NSNumber numberWithDouble: self.{0}]',
			parse: '[[data objectForKey:@"{0}"] doubleValue]',
			defaultValue: '0.0'
		},
		'date': {
			cocoaType: 'NSDate',
			pointer: true,
			parameter: '[PeakSqlite dateToValue: self.{0}]',
			parse: '[PeakSqlite valueToDate: [data objectForKey:@"{0}"]]',
			defaultValue: 'nil'
		},
		//如果属性是字符，则影射mapping的某个类型
		'datetime': 'date'
	};
}

//执行某个任务
entityMaker.prototype.run = function(schema, sql){
	//如果参数是sql语句，则先分析出schema
	if(typeof(schema) == 'string'){
		schema = analyzer.analyseWithSql(schema);
		sql = schema;
	}
	this.makeOne(schema, sql);
}

//大写第一个字母
entityMaker.prototype.upperFirstLetter = function(text){
	return text.replace(/^\w/, function(a, b){return a.toUpperCase()});
}

//格式化字段名称，可能需要替换掉下划线
entityMaker.prototype.formatFieldName = function(fieldName){
	if(fieldName == 'id') return 'ID';
	//不允许下划线的字段名，转换为大小写的形式
	if(!this.options.allowUnderscore){
		fieldName = fieldName.replace(/_(\w)/g, function(a, b){
			return b.toUpperCase()
		});
	}
	return fieldName;
}

//查找映射
entityMaker.prototype.findMapping = function(tableName, field){
	//检查是否在选项中有自定义映射
	var xPath = strformat('/.{0}.timestamp', tableName, field.name);
	var type = jpath(this.options.mapping, xPath)[0] || field.type;
	//自定义中有更具体的影射关系
	if(typeof(type) == 'object') return type;

	//从映射表中查找与cocoa的影射
	var map = this.mapping[type];
	//再次映射
	if(typeof(map) == 'string') map = this.mapping[map];
	if(!map){
		throw new Error(strformat('未找到字段{0}的映射，字段类型为：{1}', field.name, field.type));
	}
	return map;
};

//处理其中一个
entityMaker.prototype.makeOne = function(schema, sql){
	var className = this.formatFieldName(schema.tableName);
	className = this.upperFirstLetter(className);
	className = strformat(this.options.classFormatter, className);

	var data = {
		tableName: schema.tableName,
		sql: sql,
		className: className,
		fields: []
	};

	var self = this;
	schema.fields.forEach(function(item){
		//获取与cocoa的影射
		var map = self.findMapping(schema.tableName, item);
		var field = _.extend(item, map);
		field.propertyName = self.formatFieldName(item.name);
		field.parameter = strformat(map.parameter, field.propertyName);
		field.parse = strformat(map.parse, field.name);
		//主键不会显示在字段列表中
		if(field.unique){
			data.uniqueField = field;
		}else{
			data.fields.push(field);
		}
	});

	//保存实体
	this.saveEntity(data, this.dothFile, strformat('{0}.h', className));
	this.saveEntity(data, this.dotmFile, strformat('{0}.m', className));
}

//保存实体
entityMaker.prototype.saveEntity = function(data, template, fileName){
	var templateFile = path.join(__dirname, template);
	var content = fs.readFileSync(templateFile, 'utf-8');
	var template = handlebars.compile(content, {noEscape: true});
	var code = template(data);
	var saveFile = path.join(this.saveToFolder, fileName);
	fs.writeFileSync(saveFile, code);
	console.log("%s已经成功生成。", saveFile);
}

exports.makeWithSql = function(sqlist, saveTo, options){
	if(typeof(sqlist) == "string"){
		sqlist = [sqlist];
	}

	var maker = new entityMaker(saveTo, options);
	sqlist.forEach(function(sql){
		maker.run(sql);
	});
}

//根据sqlite读取
exports.makeWithSqlite = function(sqlite, saveTo, options, callback){
	//根据sqlite分析
	analyzer.analyseWithSqlite(sqlite, null, function(err, result){
		var maker = new entityMaker(saveTo, options);
		result.forEach(function(item){
			maker.run(item.schema, item.sql);
		});
		callback();
	});
}

//从配置文件中读取
exports.makeForConfig = function(cfgFile, callback){
	var cfg = require(cfgFile);
	var saveToFolder = cfg.saveToFolder;
	//如果没有设置路径，或者路径以.开头，则按相对路径处理
	if(!saveToFolder || saveToFolder.indexOf('.') == 0){
		saveToFolder = path.join(path.dirname(cfgFile), cfg.saveToFolder);
	}

	//使sqlite，通过读取sqlite获取sqlite语句
	if(cfg.sqlite){
		exports.makeWithSqlite(cfg.sqlite, saveToFolder, cfg.options, function(){
			if(callback) callback();
		});
	}else{
		//处理sql语句
		exports.makeWithSql(cfg.sqlist, saveToFolder, cfg.options);
		if(callback) callback();
	}
}