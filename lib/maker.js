#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander')
	, fs = require('fs')
	, maker = require('./')
	, path = require('path');

program
	.version(JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version)
	.usage('[debug] [options] [files]')
	.parse(process.argv);

program.name = 'peaksqlite';

//查找目录
var dir = program.args && program.args[0];
//如果没有设置，则查找当前目录下的PeakSqlite.json的文件
if(!dir){
	var file = 'PeakSqlite.json';
	if(!fs.existsSync(file)){
		console.log('无法找到配置文件：%s', file);
		return;
	}
	file = path.resolve(file);
}

//根据配置文件创建代码
maker.makeForConfig(file);