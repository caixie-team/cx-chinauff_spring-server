define({ "api": [  {    "type": "post",    "url": "/api/card/code/consume",    "title": "核销",    "group": "Card",    "name": "Consume",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "blessing_code",            "description": "<p>福码</p>"          }        ]      },      "examples": [        {          "title": "测试福码: blessing_code",          "content": "mPhkHZgWef4a5Bjsxestt",          "type": "String"        }      ]    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "json",            "optional": false,            "field": "result",            "description": ""          }        ]      },      "examples": [        {          "title": "核销兑换成功:",          "content": "{\n   \"errno\": 0,\n   \"errmsg\": \"\",\n   \"data\": \"兑换成功\"\n}",          "type": "json"        }      ]    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "type": "json",            "optional": false,            "field": "1000",            "description": "<p>请求参数错误</p>"          },          {            "group": "Error 4xx",            "type": "json",            "optional": false,            "field": "1001",            "description": "<p>兑换码无效</p>"          },          {            "group": "Error 4xx",            "type": "json",            "optional": false,            "field": "1002",            "description": "<p>已被兑换</p>"          },          {            "group": "Error 4xx",            "type": "json",            "optional": false,            "field": "1003",            "description": "<p>未预约</p>"          },          {            "group": "Error 4xx",            "type": "json",            "optional": false,            "field": "1004",            "description": "<p>兑换时间</p>"          }        ]      },      "examples": [        {          "title": "Error-1000:",          "content": "{\n\"errno\": 1000,\n\"errmsg\": \"请求参数错误\"\n}",          "type": "json"        },        {          "title": "Error-10001:",          "content": "{\n\"errno\": 1001,\n\"errmsg\": \"兑换码无效\"\n}",          "type": "json"        },        {          "title": "Error-1002:",          "content": "{\n\"errno\": 1002,\n\"errmsg\": \"已被兑换\"\n}",          "type": "json"        },        {          "title": "Error-1003:",          "content": "{\n\"errno\": 1003,\n\"errmsg\": \"未预约\"\n}",          "type": "json"        },        {          "title": "Error-1004:",          "content": "{\n\"errno\": 1004,\n\"errmsg\": \"可到店兑换时间:2019年1月5日00:00:00 - 2019年2月4日13:59:59\"\n}",          "type": "json"        }      ]    },    "sampleRequest": [      {        "url": "http://spring.chinauff.com/api/card/code/consume"      }    ],    "version": "1.0.0",    "filename": "src/api/controller/blessing.js",    "groupTitle": "Card"  },  {    "type": "post",    "url": "/api/card/code/get",    "title": "查询 Code",    "group": "Card",    "description": "<p>查询 Code 接口</p>",    "name": "getCode",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "blessing_code",            "description": "<p>福码</p>"          }        ]      },      "examples": [        {          "title": "blessing_code",          "content": "mPhkHZgWef4a5Bjsxestt",          "type": "String"        }      ]    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "json",            "optional": false,            "field": "result",            "description": ""          }        ]      },      "examples": [        {          "title": "卡劵状态正常:",          "content": "{\n   \"errno\": 0,\n   \"errmsg\": \"\",\n   \"data\": {\n     \"shop_name\": \"湖州红旗路餐厅\",\n     \"shop_code\": 210910010001,\n     \"blessing_code\": \"mPhkHZgWef4a5Bjsxestt\",\n     \"reserve_date\": \"2019-02-01\"\n   }\n}",          "type": "json"        }      ]    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "type": "json",            "optional": false,            "field": "1000",            "description": "<p>请求参数错误</p>"          },          {            "group": "Error 4xx",            "type": "json",            "optional": false,            "field": "1001",            "description": "<p>未预约</p>"          }        ]      },      "examples": [        {          "title": "Error-1000:",          "content": "{\n\"errno\": 1000,\n\"errmsg\": \"请求参数错误\"\n}",          "type": "json"        },        {          "title": "Error-10001:",          "content": "{\n\"errno\": 1001,\n\"errmsg\": \"未预约\"\n}",          "type": "json"        }      ]    },    "sampleRequest": [      {        "url": "http://spring.chinauff.com/api/card/code/get"      }    ],    "version": "1.0.0",    "filename": "src/api/controller/blessing.js",    "groupTitle": "Card"  }] });
