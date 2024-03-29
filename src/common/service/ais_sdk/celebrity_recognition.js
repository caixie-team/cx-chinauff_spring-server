var https = require("https");
var utils = require("./utils");
var signer = require("./signer");
var ais = require("./ais");

module.exports = {
    celebrity_recognition: function (token, data, url, threshold = 0.48, callback) {

        // 构建请求信息和请求参数信息
        var requestData = {"image": data, "url": url, "threshold": threshold};
        var headers = {"Content-Type": "application/json", "X-Auth-Token": token};
        var options = utils.getHttpRequestEntityOptions(ais.ENDPOINT, "POST", ais.CELEBRITY_RECOGNITION, headers);
        var requestBody = JSON.stringify(requestData);

        var request = https.request(options, function (response) {

            // 验证服务调用返回的状态是否成功，如果为200, 为成功, 否则失败。
            if (response.statusCode !== 200) {
                console.log("Process the celebrity recognition result failed!");
                return;
            }
            // 处理结果信息，输入返回信息
            response.on("data", function (chunk) {
                callback(chunk.toString())
            })
        });

        request.on("error", function (err) {
            console.log(err.message);
        });

        request.write(requestBody);
        request.end();
    },

    celebrity_recognition_aksk: function (_ak, _sk, data, url, threshold = 0.48, callback) {

        // 配置ak，sk信息
        var sig = new signer.Signer();
        sig.AppKey = _ak;                   // 构建ak
        sig.AppSecret = _sk;                // 构建sk

        // 构建请求信息和请求参数信息
        var requestData = {"image": data, "url": url};
        var _headers = {"Content-Type": "application/json"};
        var req = new signer.HttpRequest();
        var options = utils.getHttpRequestEntity(sig, req, ais.ENDPOINT, "POST", ais.CELEBRITY_RECOGNITION, "", _headers, requestData);

        var requset = https.request(options, function (response) {

            // 验证服务调用返回的状态是否成功，如果为200, 为成功, 否则失败。
            if (response.statusCode !== 200) {
                console.log("Process the celebrity recognition result failed!");
                return;
            }
            response.on("data", function (chunk) {
                callback(chunk.toString());
            })
        });

        requset.on("error", function (err) {
            console.log(err.message);
        });

        requset.write(req.body);
        requset.end();
    }

};