peaksqlite-entity-maker
=======================

用于PeakSqlite项目的实体生成器，需要配合PeakSqlite项目使用，可以根据建表的sql语句自动生成数据实体代码，简化Sqlite的操作。
每个表将会生成一个实体，必需要有一个主键，并且主键的数据类型应为integer，但主键名可以是其它名字。

#Information

Conis

Blog: [http://iove.net](http://iove.net)

E-mail: [conis.yi@gmail.com](conis.yi@gmail.com)

#Usage
`npm install peaksqlite-entity-maker`，建议使用全局方式进行安装，`npm install -g peaksqlite-entity-maker`

##通过命令行调用方式
此方式也是最常用的调用方式，如下：
1. 创建一个配置文件`PeakSqlite.json`，格式请参照`test/PeakSqlite.json`。
2. 打开终端，运行`peaksqlite <path>`，如果不指定path，将会到当前目前查找`PeakSqlite.json`的配置文件。

##直接的调用方式
````js
  var maker = require('peaksqlite-entity-maker');
  //通过sql的方式调用
  maker.makeWithSql(sql, saveTo, options);
  //通过sqlite调用
  maker.makeWithSqlite(sqlite, saveTo, options, callback);
  //通过配置文件调用
  maker.makeForConfig(cfgFile, callback);
````

##PeakSqlite配置指南
`sqlite`: 可以直接给定一个sqlite文件的路径，如果`sqlite`为字符类型，则直接读取sqlite数据库；如果`sqlite`为数组，则应该是sql语句列表。
`saveToFolder`: 生成的实体要保存的目录

#options
配置文件中的`options`与`makeWithSql`、`makeWithSqlite`、`makeForConfig`中的`options`是一样的。
'classFormatter': 类的格式化方式，默认为"{0}Entity"，即生成表名+Entity的方式，如TodolistEntity。
`allowUnderscore`：是否允许下划线，默认为`false`，会将字段和表名中的下划线转换为大小写的方式，如todo_level转换为todoLevel。
`mapping`：重新定义映射，主要是针对数据库中的数据类型与实际类型不一致的情况，目前重点是针对日期类型。
    "mapping":{
      //表名
      "todolist": {
        //字段名重新对应数据类型为日期类型
        "timestamp": "date"
      },
      "category": {
        "timestamp": "date"
      }
    }
##其它

自用模块，使用说明欠奉，可参考测试用例中的代码，请参考示例代码，欢迎完善。
对建表的Sql语句会有较高的要求，没有加入容错设计。
日期类型需要注意，因为FMDB无法处理日期格式的数据类型，我建议存储的时候使用double或者float类型，然后在`options.mapping`中作映射，请参考`test/PeakSqlite.json`文件中的示例

#LICENSE
MIT