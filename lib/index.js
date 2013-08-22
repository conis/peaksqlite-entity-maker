var _ = require('underscore');
var analyzer = require('sql-analyzer');
var strformat = require('strformat');
var handlebars = require('handlebars');
var path = require('path');
var fs = require('fs');

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

var entityMaker = function(sqlist, saveTo, options){
	this.dothFile = "template-h.handlebars";
	this.dotmFile = "template-m.handlebars";
	//保存到文件夹，默认保存到当前目录
	this.saveToFolder = saveTo || __dirname;
	this.options = _.extend(options || {}, {
		allowUnderscore: false,
		//类名的格式化
		classFormatter: '{0}Entity'
	});

	//sqlite与cocoa数据类型的影射
	this.mapping = {
		'boolean': {
			cocoaType: 'BOOL',
			//将参数压入到NSArray时的转换
			parameter: '[NSNumber numberWithBool: self.{0}]',
			//从dict中转换转换到cocoa的属性
			parse: '[[self.data objectForKey:@"{0}"] boolValue]'
		},
		//pointer：是否为指针
		'text': {
			cocoaType: 'NSString',
			pointer: true,
			parameter: '[PeakSqlite nilFilter: self.{0}]',
			parse: '[PeakSqlite valueToString: [data objectForKey:@"{0}"]]'
		},
		'integer': {
			cocoaType: 'NSInteger',
			parameter: '[NSNumber numberWithInt: self.{0}]',
			parse: '[[data objectForKey:@"{0}"] intValue]'
		},
		'float': {
			cocoaType: 'double',
			parameter: '[NSNumber numberWithDouble: self.{0}]',
			parse: '[[data objectForKey:@"{0}"] doubleValue]'
		},
		'date': {
			cocoaType: 'NSDate',
			pointer: true,
			parameter: '[PeakSqlite dateToValue: self.{0}]',
			parse: '[PeakSqlite valueToDate: [data objectForKey:@"{0}"]]'
		},
		//如果属性是字符，则影射mapping的某个类型
		'datetime': 'date'
	};

	var self = this;
	sqlist.forEach(function(sql){
		var schema = analyzer.analyseWithSql(sql);
		self.makeOne(schema, sql);
	});
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
		var field = _.extend({}, item);
		//获取与cocoa的影射
		var map = self.mapping[item.type];
		//再次映射
		if(typeof(map) == 'string') map = map = self.mapping[map];
		if(!map){
			throw new Error(strformat('未找到字段{0}的映射，字段类型为：{1}', item.name, item.type));
		}
		field = _.extend(field, map);
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
	console.log("%s.h,%s.m已经成功生成。", className, className);
}

//保存实体
entityMaker.prototype.saveEntity = function(data, template, fileName){
	var templateFile = path.join(__dirname, template);
	var content = fs.readFileSync(templateFile, 'utf-8');
	var template = handlebars.compile(content, {noEscape: true});
	var code = template(data);
	var saveFile = path.join(this.saveToFolder, fileName);
	fs.writeFileSync(saveFile, code);
}

exports.make = function(sqlist, saveTo, options){
	if(typeof(sqlist) == "string"){
		sqlist = [sqlist];
	}

	var maker = new entityMaker(sqlist, saveTo, options);

}