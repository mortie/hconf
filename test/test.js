var assert = require("assert");

var parser = require("..");

describe("parser", () => {
	it("parses booleans", () => {
		assert.strictEqual(
			parser.parseString("true", true),
			true);
		assert.strictEqual(
			parser.parseString("false", true),
			false);
	});

	it("parses null", () => {
		assert.strictEqual(
			parser.parseString("null", true),
			null);
	});

	it("parses numbers", () => {
		assert.strictEqual(
			parser.parseString("105", true),
			105);
		assert.strictEqual(
			parser.parseString("103.995", true),
			103.995);
		assert.strictEqual(
			parser.parseString("-10", true),
			-10);
	});
	it("parses positive exponential notation", () => {
		assert.strictEqual(
			parser.parseString("105.99e5", true),
			105.99e5);
		assert.strictEqual(
			parser.parseString("105.99e+5", true),
			105.99e5);
		assert.strictEqual(
			parser.parseString("105.99E5", true),
			105.99e5);
		assert.strictEqual(
			parser.parseString("105.99E+5", true),
			105.99e5);
	});
	it("parses negative exponential notation", () => {
		assert.strictEqual(
			parser.parseString("105.99e-5", true),
			105.99e-5);
		assert.strictEqual(
			parser.parseString("105.99E-5", true),
			105.99E-5);
	});
	it("only accepts one period in numbers", () => {
		assert.deepEqual(
			parser.parseString("[ 10.44.55 ]", true),
			[ "10.44.55" ]); // string, not number
	});

	it("parses strings", () => {
		assert.strictEqual(
			parser.parseString("\"Hello World\"", true),
			"Hello World");
	});
	it("parses strings without quotes", () => {
		assert.strictEqual(
			parser.parseString("hello-world", true),
			"hello-world");
	});

	it("parses arrays", () => {
		assert.deepEqual(
			parser.parseString("[10 50 449 true]", true),
			[10, 50, 449, true]);
	});
	it("parses nested arrays", () => {
		assert.deepEqual(
			parser.parseString("[10 [ [ 3 7 ] 55 6]]", true),
			[10, [ [3, 7 ], 55, 6]]);
	});

	it("parses objects", () => {
		assert.deepEqual(
			parser.parseString("{ foo 10 bar 555 }", true),
			{ foo: 10, bar: 555 });
	});
	it("parses nested objects", () => {
		assert.deepEqual(
			parser.parseString("{ foo 10 bar { no 4 hey 33 } }", true),
			{ foo: 10, bar: { no: 4, hey: 33 } });
	});

	it("parses arrays in objects", () => {
		assert.deepEqual(
			parser.parseString("{ foo 10 bar [ no 4 hey 33 ] }", true),
			{ foo: 10, bar: [ "no", 4, "hey", 33 ] });
	});
	it("parses objects in arrays", () => {
		assert.deepEqual(
			parser.parseString("[ foo 10 bar { no 4 hey 33 } ]", true),
			[ "foo", 10, "bar", { no: 4, hey: 33 } ]);
	});

	it("does not parse inline comments", () => {
		assert.deepEqual(
			parser.parseString("null # a comment'\"]}[{", true),
			null);
		assert.deepEqual(
			parser.parseString("after-strings # a comment'\"]}[{", true),
			"after-strings");
		assert.deepEqual(
			parser.parseString("[after arrays] # a comment'\"]}[{", true),
			[ "after", "arrays" ]);
		assert.deepEqual(
			parser.parseString("{after objects} # a comment'\"]}[{", true),
			{ after: "objects" });
	});
	it("does not parse whole line comments", () => {
		assert.deepEqual(
			parser.parseString("# a comment'\"]}[{\nnull", true),
			null);
		assert.deepEqual(
			parser.parseString("# a comment'\"]}[{\nbefore-strings", true),
			"before-strings");
		assert.deepEqual(
			parser.parseString("# a comment'\"]}[{\n[before arrays]", true),
			[ "before", "arrays" ]);
		assert.deepEqual(
			parser.parseString("# a comment'\"]}[{\n{before objects}", true),
			{ before: "objects" });
	});
});

describe("interface", () => {
	describe("parseFile", () => {
		it("parses the example file correctly", () => {
			assert.deepEqual(
				parser.parseFile("test/parse-file.hcnf"),
				{ foo: { bar: 55, baz: "Hello World" }, bar: 10 });
		});
		it("parses the example file with a root correctly", () => {
			assert.deepEqual(
				parser.parseFile("test/parse-file-root.hcnf", true),
				[ 10, 5, "no" ]);
		});
	});

	describe("parseConfFile", () => {
		it("parses the example file correctly", () => {
			assert.deepEqual(
				parser.parseConfFile("test/parse-conf-file.hcnf"),
				{
					foo: [
						{ name: "bar", baz: 10 },
						{ name: "no", baz: 99 },
					],
					bar: [
						{ name: null, a: "b" }
					]
				});
		});
	});

	describe("parseConfString", () => {
		it("parses the example string correctly", () => {
			assert.deepEqual(
				parser.parseConfString(
					"foo bar { baz 10 } foo no { baz 20 }"),
				{
					foo: [
						{ name: "bar", baz: 10 },
						{ name: "no", baz: 20 },
					]
				});
		});
	});

	describe("parseConf", () => {
		it("throws an error if an unspecified section is given", () => {
			try {
				parser.parseConfString(
					"general { port 8080 } general { port 8081 }",
					{ general: "once" });
			} catch (err) {
				if (err.hconfigParseError)
					return;
				else
					throw err;
			}
			throw new Error("Expected an error to be thrown");
		});

		it("returns sections which only exist once as an object", () => {
			assert.deepEqual(
				parser.parseConfString(
					"general { port 8080 }",
					{ general: "once" }),
				{ general: { name: null, port: 8080 } });
		});

		it("returns sections which exist multiple times as an array", () => {
			assert.deepEqual(
				parser.parseConfString(
					"foo { bar baz } foo { baz bar }",
					{ foo: "many" }),
				{
					foo: [
						{ name: null, bar: "baz" },
						{ name: null, baz: "bar" },
					]
				});
		});
	});
});

describe("example files", () => {
	it("example 1", () => {
		assert.deepEqual(
			parser.parseConfFile(
				"test/example-1.hcnf",
				{ general: "once", "virtual-host": "many" }),
			{
				general: {
					name: null,
					port: 8080,
					host: "localhost",
					index: [ ".html", ".htm" ],
				},
				"virtual-host": [
					{ name: "cats.example.com", webroot: "/var/www/mycats" },
					{ name: "resume.example.com", webroot: "/var/www/resume" },
				],
			});
	});

	it("example 2", () => {
		assert.deepEqual(
			parser.parseConfFile("test/example-2.hcnf"),
			{
				"virtual-host": [
					{ name: "http://cats.example.com", webroot: "/var/www/mycats" },
					{ name: "http://resume.example.com", webroot: "/var/www/resume" },
					{
						name: "https://webmail.example.com",
						"ssl-cert": "/etc/ssl/example.com.pem",
						"ssl-key": "/etc/ssl/example.com.key",
						webroot: "/var/www/webmail",
					},
				]
			});
	});
});

describe("validation", () => {
	it("disallows empty section names if desired", () => {
		try {
			parser.parseConfString("foo {}",
				{ foo: { count: "once", props: { name: "string" } } });
		} catch (err) {
			if (err.hconfigParseError)
				return;
			else
				throw err;
		}
		throw new Error("Expected error to be thrown");
	});

	it("defaults to * if specified", () => {
		assert.deepEqual(
			parser.parseConfString(
				"foo { a 10 b hello c true }",
				{ foo: { count: "once", props: { "*": "any" } } }),
			{ foo: { name: null, a: 10, b: "hello", c: true } });
	});
});

describe("strings", () => {
	it("doesn't expand anything in single-quote strings", () => {
		assert.strictEqual(
			parser.parseString("'$(FOO) \\t'", true),
			"$(FOO) \\t");
	});

	it("expands environment variables", () => {
		assert.strictEqual(
			parser.parseString('"$(USER)"', true),
			process.env.USER);
	});

	it("expands escape sequences", () => {
		assert.strictEqual(
			parser.parseString('"\\\\\\\\ \\" \\f \\n \\r \\t \\u4444"', true),
			"\\\\ \" \f \n \r \t \u4444");
	});
});

describe("unquoted strings", () => {
	it("doesn't expand anything in unquoted strings", () => {
		assert.strictEqual(
			parser.parseString("$(FOO)'\"\\n\\t", true),
			"$(FOO)'\"\\n\\t");
	});
	it("# ends an unquoted string", () => {
		assert.strictEqual(
			parser.parseString("$(FOO)'\"#\\n\\tabc", true),
			"$(FOO)'\"");
	});

	it("{ starts an object", () => {
		assert.deepEqual(
			parser.parseString("key{ key value }", false),
			{ key: { key: "value" } });
	});
	it("key starts immediately after {", () => {
		assert.deepEqual(
			parser.parseString("key {key value }", false),
			{ key: { key: "value" } });
	});
	it("} ends an object", () => {
		assert.deepEqual(
			parser.parseString("key { key value}", false),
			{ key: { key: "value" } });
	});
	it("key ends immediately after }", () => {
		assert.deepEqual(
			parser.parseString("key { key value }key2 value2", false),
			{ key: { key: "value" }, key2: "value2" });
	});

	it("[ starts an array", () => {
		assert.deepEqual(
			parser.parseString("key[ key value ]", false),
			{ key: [ "key", "value" ] });
	});
	it("key starts immediately after [", () => {
		assert.deepEqual(
			parser.parseString("key [key value ]", false),
			{ key: [ "key", "value" ] });
	});
	it("] ends an array", () => {
		assert.deepEqual(
			parser.parseString("key [ key value]", false),
			{ key: [ "key", "value" ] });
	});
	it("key ends immediately after ]", () => {
		assert.deepEqual(
			parser.parseString("key [ key value ]key2 value2", false),
			{ key: [ "key", "value" ], key2: "value2" });
	});
});
