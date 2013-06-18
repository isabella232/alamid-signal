"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    Signal = require("../" + require("../package.json").main),
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("Signal", function () {

    it("should return a new signal", function () {
        expect(new Signal()).to.be.a("function");
    });

    it("should returm a new signal with the given value", function () {
        expect(new Signal("hello")()).to.equal("hello");
    });

});

describe("Signal (instance)", function () {
    var signal;

    beforeEach(function () {
        signal = new Signal();
    });

    it("should be an instance of Function", function () {
        expect(signal).to.be.an.instanceof(Function);
    });

    it("should return undefined when calling it initially", function () {
        expect(signal()).to.be.an("undefined");
    });

    it("should return the new value when calling it with a value", function () {
        var obj = {};

        expect(signal(2)).to.equal(2);
        expect(signal(obj)).to.equal(obj);
    });

    it("should return the last set value when calling it with no arguments", function () {
        signal("Ahoy!");
        expect(signal()).to.equal("Ahoy!");
        signal(true);
        expect(signal()).to.equal(true);
    });

    describe(".notify()", function () {

        it("should call the given functions after a value has been set", function () {
            var a = sinon.spy(),
                b = sinon.spy();

            signal.notify(a, b);
            expect(a).to.not.have.been.called;
            expect(b).to.not.have.been.called;

            signal("Ahoy!");

            expect(a).to.have.been.called;
            expect(b).to.have.been.called;
        });

        it("should call the listeners with a proper change event-object containing the name, target, oldValue and newValue", function (done) {
            signal(false);
            signal.notify(function (event) {
                expect(event).to.have.property("name", "change");
                expect(event).to.have.property("target", signal);
                expect(event).to.have.property("oldValue", false);
                expect(event).to.have.property("newValue", true);
                done();
            });
            signal(true);
        });

        it("should notify the listeners in the given order", function () {
            var called = [];

            signal.notify(function () {
                called.push(1);
            });
            signal.notify(function () {
                called.push(2);
            });
            signal(true);
            expect(called).to.eql([1, 2]);
        });

        it("should call all listeners with the same event object", function () {
            var a = sinon.spy(),
                b = sinon.spy();

            signal.notify(a);
            signal.notify(b);
            signal(true);
            expect(a.firstCall.args[0]).to.equal(b.firstCall.args[0]);
        });

        it("should also accept other signals that will adopt the new value", function () {
            var otherSignal = new Signal();

            signal.notify(otherSignal);
            signal("hello otherSignal");
            expect(otherSignal()).to.equal("hello otherSignal");
        });

        it("should reflect already the new value when the change event occurs", function (done) {
            signal.notify(function () {
                expect(signal()).to.equal("What up?");
                done();
            });
            signal("What up?");
        });

        it("should be chainable", function () {
            expect(signal.notify(function () {})).to.equal(signal);
        });

    });

    describe(".unnotify()", function () {

        it("should remove the given listeners from notification", function () {
            var a = sinon.spy(),
                b = sinon.spy();

            signal.notify(a, b);
            signal.unnotify(a, b);
            signal("hello");

            expect(a).to.not.have.been.called;
            expect(b).to.not.have.been.called;
        });

        it("should also remove the given signals", function () {
            var otherSignal1 = new Signal("hi"),
                otherSignal2 = new Signal("hi");

            signal.notify(otherSignal1, otherSignal2);
            signal.unnotify(otherSignal1, otherSignal2);

            signal("hello");
            expect(otherSignal1()).to.equal("hi");
            expect(otherSignal1()).to.equal("hi");
        });

        it("should not remove other listeners", function () {
            var a = sinon.spy(),
                b = sinon.spy();

            signal.notify(a, b);
            signal.unnotify(a);
            signal("hello");

            expect(b).to.have.been.called;
        });

        it("should do nothing if the supplied listener has never been added", function () {
            expect(function () {
                signal.unnotify(function () {});
            }).to.not.throw();
        });

        it("should be chainable", function () {
            function a() {}

            signal.notify(a);

            expect(signal.unnotify(a)).to.equal(signal);
        });

    });

    describe(".dispose()", function () {

        it("should delete the internal value", function () {
            var obj = {};

            signal(obj);
            signal.dispose();

            expect(signal()).to.equal(undefined);
        });

        it("should remove all listeners", function () {
            var a = sinon.spy(),
                b = sinon.spy();

            signal.notify(a, b);
            signal.dispose();
            signal(true);

            expect(a).to.not.have.been.called;
            expect(b).to.not.have.been.called;
        });

    });

});