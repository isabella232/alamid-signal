"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    Signal = require("../" + require("../package.json").main),
    EventEmitter = require("events").EventEmitter,
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("Signal", function () {

    describe("(instance)", function () {
        var signal;

        beforeEach(function () {
            signal = new Signal();
        });

        it("should be an instance of EventEmitter", function () {
            expect(signal).to.be.an.instanceof(EventEmitter);
        });

        describe(".get() when no data has been written yet", function () {

            it("should return undefined", function () {
                expect(signal.get()).to.be.an("undefined");
            });

        });

        describe(".set()", function () {

            it("should return the old value", function () {
                expect(signal.set("hello")).to.be.an("undefined");
                expect(signal.set("how art thou?")).to.equal("hello");
            });

            it("should emit a 'readable'-event", function (done) {
                signal.on("readable", function () {
                    expect(signal.read()).to.equal("La vie en rose");
                    done();
                });
                signal.set("La vie en rose");
            });

        });

        describe(".get() when there has already been data written", function () {

            it("should return the last written data", function () {
                var obj = {};

                signal.write("Wenn er mich in den Arm nimmt");
                expect(signal.read()).to.equal("Wenn er mich in den Arm nimmt");
                signal.write("Wenn er leise mit mir spricht");
                expect(signal.read()).to.equal("Wenn er leise mit mir spricht");
                signal.write("Sehe ich das Leben in der Rose.");
                expect(signal.read()).to.equal("Sehe ich das Leben in der Rose.");
                signal.write(true);
                expect(signal.read()).to.be.true;
                signal.write(obj);
                expect(signal.read()).to.equal(obj);
            });

        });

        describe(".write(chunk)", function () {
            
            it("should proxy to .set()", function () {
                sinon.spy(signal, "set");
                signal.write("hello");
                expect(signal.set).to.have.been.calledOnce;
                expect(signal.set).to.have.been.calledWith("hello");
            });

            it("should return true for stream api compliance", function () {
                expect(signal.write("hello")).to.be.true;
            });

        });

        describe(".write(chunk, encoding)", function () {

            it("should accept an encoding but ignore it", function () {
                signal.write("hello", "utf8");
                expect(signal.get()).to.equal("hello");
            });

        });

        describe(".wite(chunk, callback)", function () {

            it("should accept a callback and call it immediately after 0ms", function (done) {
                var now = new Date(),
                    callbackIsSynchronous = true;

                signal.write("hello", function () {
                    expect(callbackIsSynchronous).to.be.false;
                    expect(new Date().getTime() - now.getTime()).to.be.below(30);
                    done();
                });

                callbackIsSynchronous = false;
            });

        });

        describe(".wite(chunk, encoding, callback)", function () {

            it("should accept an encoding (and ignore it) and a callback and call it immediately after 0ms", function (done) {
                var now = new Date(),
                    callbackIsSynchronous = true;

                signal.write("hello", "utf8", function () {
                    expect(callbackIsSynchronous).to.be.false;
                    expect(new Date().getTime() - now.getTime()).to.be.below(30);
                    done();
                });

                callbackIsSynchronous = false;
            });

        });

        describe(".end()", function () {

            it("should emit an 'end'-event", function (done) {
                signal.on("end", done);
                signal.end();
            });

        });

        describe(".end(chunk)", function () {

            it("should proxy to .write()", function () {
                function callback() {}

                sinon.spy(signal, "write");
                signal.end("data", "utf8", callback);
                expect(signal.write).to.have.been.calledOnce;
                expect(signal.write).to.have.been.calledWith("data", "utf8", callback);
            });

            it("should emit an 'end'-event after .write() has been called", function (done) {
                signal.on("end", function () {
                    expect(signal.write).to.have.been.calledOnce;
                    done();
                });
                sinon.spy(signal, "write");
                signal.end("data");
            });

        });

        describe("(in node)", function () {
            var fs = require("fs");

            it("should be possible to use it as a destination of a pipe", function (done) {
                var receivedData = "",
                    expectedData = fs.readFileSync(__filename, { encoding: "utf8" });

                signal.on("readable", function () {
                    receivedData += signal.read();
                });
                signal.on("end", function () {
                    expect(receivedData).to.equal(expectedData);
                    done();
                });
                fs.createReadStream(__filename).pipe(signal);
            });

            it("should be possible to use it as a source of a pipe", function (done) {
                var receivedData = "",
                    expectedData = fs.readFileSync(__filename, { encoding: "utf8" });

                signal.on("readable", function () {
                    receivedData += signal.read();
                });
                signal.on("end", function () {
                    expect(receivedData).to.equal(expectedData);
                    done();
                });
                fs.createReadStream(__filename).pipe(signal);
            });

        });

    });
});