var expect = require('expect.js');
var maker = require('../lib/index');
var path = require('path');

describe('测试使用Sql语句', function(){
	it('', function(){
		return;
		var sql = ['CREATE TABLE if not exists todolist(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, timestamp FLOAT, done boolean DEFAULT false, todo TEXT, todo_level integer)'];
		maker.makeWithSql(sql,  "/Users/conis/WorkStation/project/Peak/PeakSqlite/");
	});
});

describe('测试根据sqlite数据库生成生成', function(){
	it('', function(){

		//maker.makeWithConfig(path.join(__dirname, 'PeakSqlite.json'));
	});
});