peaksqlite-entity-maker
=======================

用于PeakSqlite项目的实体生成器，需要配合PeakSqlite项目使用，可以根据建表的sql语句自动生成数据实体代码，简化Sqlite的操作。
每个表将会生成一个实体，必需要有一个主键，并且主键的数据类型应为integer，但主键名可以是其它名字。

#Information

Conis

Blog: [http://iove.net](http://iove.net)

E-mail: [conis.yi@gmail.com](conis.yi@gmail.com)

#Usage

自用模块，使用说明欠奉，可参考测试用例中的代码，请参考示例代码，欢迎完善。
对建表的Sql语句会有较高的要求，没有加入容错设计。
日期类型需要注意，因为FMDB无法处理日期格式的数据类型，我一般的做法是准备两套sql代码，建表时日期类型的字段为float或者double类型，用于生成代码的字段类型为date类型。
例如：
建表的时候使用：`CREATE TABLE if not exists todolist(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, timestamp FLOAT, done boolean DEFAULT false, todo TEXT, todo_level integer)`

生成实体代码的时候使用：`CREATE TABLE if not exists todolist(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, timestamp datetime, done boolean DEFAULT false, todo TEXT, todo_level integer)`

注意`timestamp`的数据类型是有变化的，然后在实体代码中处理，存储到数据库的时候转换一下，取数据的时候也需要转换一下。

谁有什么好招？支个招，确实很麻烦！！！

#LICENSE
MIT