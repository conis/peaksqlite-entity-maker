var expect = require('expect.js');
var maker = require('../lib/index');

describe('测试用例', function(){
	it('', function(){
		var sql = ['CREATE TABLE if not exists todolist(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, timestamp FLOAT, done boolean DEFAULT false, todo TEXT, todo_level integer)'];
		maker.make(sql, null);
	});
});