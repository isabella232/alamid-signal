"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    Signal = require("../" + require("../package.json").main),
    expect = chai.expect;

chai.Assertion.includeStack = true;
chai.use(require("sinon-chai"));

describe("Signal", function () {

    it("should return a new signal", function () {
        expect(new Signal()).to.be.a("function");
    });

    it("should return a new signal with the given value", function () {
        expect(new Signal("hello")()).to.equal("hello");
    });

    describe(".totalListeners", function () {
        var signal1,
            signal2;

        function listener() {}

        before(function () {
            signal1 = new Signal();
            signal2 = new Signal();
        });

        it("should be 0 by default", function () {
            expect(Signal.totalListeners).to.equal(0);
        });

        it("should increase by the number of listeners that have been added to an instance", function () {
            // even if the same instance gets added three times, the listener count will still increase by three
            signal1.subscribe(listener);
            signal1.subscribe(listener);
            signal1.subscribe(listener);
            signal1.subscribe(function () {});
            signal1.subscribe(function () {});

            expect(Signal.totalListeners).to.equal(5);
        });

        it("should decrease by the number of listeners that have been removed on an instance", function () {
            signal1.unsubscribe(listener);
            expect(Signal.totalListeners).to.equal(4);
            signal2.unsubscribe(listener); // has never been added as listener
            expect(Signal.totalListeners).to.equal(4);
        });

        it("should decrease by the number of listeners that have been disposed", function () {
            signal1.dispose();
            signal2.dispose();

            expect(Signal.totalListeners).to.equal(0);
        });

    });

    describe(".use(plugin, config?)", function () {
        var plugin,
            config;

        beforeEach(function () {
            plugin = sinon.spy();
            config = {};
        });

        it("should provide a plugin-interface", function () {
            Signal.use(plugin, config);
            expect(plugin).to.have.been.calledWith(Signal, config);
        });

        it("should be usable on other objects too", function () {
            var otherObj = {
                use: Signal.use
            };

            otherObj.use(plugin);
            expect(plugin).to.have.been.calledWith(otherObj);
        });

        it("should be chainable", function () {
            expect(Signal.use(function () {})).to.equal(Signal);
        });

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

    it("should return the last set value when calling it with no arguments", function () {
        signal("Ahoy!");
        expect(signal()).to.equal("Ahoy!");
        signal(true);
        expect(signal()).to.equal(true);
    });

    describe(".constructor", function () {

        it("should be Signal", function () {
            expect(signal.constructor).to.equal(Signal);
        });

    });

    describe(".setter", function () {

        it("should be called when a new value is set", function () {
            signal.setter = sinon.spy();
            signal("hey ho");

            expect(signal.setter).to.have.been.called;
        });

        it("should be called with the new value", function () {
            signal.setter = sinon.spy();
            signal("hey ho");

            expect(signal.setter).to.have.been.calledWith("hey ho");
        });

        it("should be called before the new value is set", function (done) {
            signal.setter = function () {
                expect(signal()).to.equal(undefined);
                done();
            };

            signal("hello");
        });

        it("should override the new value", function () {
            var value;

            signal.setter = function () {
               return "hey";
            };

            signal.subscribe(function (newValue) {
                value = newValue;
            });

            signal("ho");
            expect(signal()).to.equal("hey");
            expect(value).to.equal("hey");
        });

    });

    describe(".subscribe(listener)", function () {

        it("should call the given function after a value has been set", function () {
            var a = sinon.spy(),
                b = sinon.spy();

            signal.subscribe(a);
            signal.subscribe(b);

            expect(a).to.not.have.been.called;
            expect(b).to.not.have.been.called;

            signal("Ahoy!");

            expect(a).to.have.been.called;
            expect(b).to.have.been.called;
        });

        it("should only call the listeners when the value actually changes", function () {
            var a = sinon.spy();

            signal.subscribe(a);

            signal(true);
            signal(true);

            expect(a).to.have.been.calledOnce;
        });

        it("should call the listeners with the new value, the old value and the signal which changed", function (done) {
            signal(false);
            signal.subscribe(function (newValue, oldValue, target) {
                expect(newValue).to.equal(true);
                expect(oldValue).to.equal(false);
                expect(target).to.equal(signal);
                done();
            });
            signal(true);
        });

        it("should subscribe the listeners in the given order", function () {
            var called = [];

            signal.subscribe(function () {
                called.push(1);
            });
            signal.subscribe(function () {
                called.push(2);
            });
            signal(true);

            expect(called).to.eql([1, 2]);
        });

        it("should also accept other signals that will adopt the new value", function () {
            var otherSignal = new Signal();

            signal.subscribe(otherSignal);
            signal("hello otherSignal");

            expect(otherSignal()).to.equal("hello otherSignal");
        });

        it("should reflect already the new value when the change occurred", function (done) {
            signal.subscribe(function () {
                expect(signal()).to.equal("What up?");
                done();
            });
            signal("What up?");
        });

        it("should not trigger if the new value and the old value are both primitives and equal", function () {
            var listener = sinon.spy();

            signal.subscribe(listener);
            signal(undefined);
            signal(true);
            signal(true);
            signal("hi");
            signal("hi");
            signal(0);
            signal(0);

            expect(listener).to.have.been.calledThrice;
        });

        it("should trigger every time a non-primitive value is passed", function () {
            var listener = sinon.spy(),
                arr = [],
                func = function () {},
                regex = /asd/,
                obj = {};

            signal.subscribe(listener);
            signal(obj);
            signal(obj);
            signal(arr);
            signal(arr);
            signal(func);
            signal(func);
            signal(regex);
            signal(regex);

            expect(listener.callCount).to.equal(8);
        });

        it("should be chainable", function () {
            expect(signal.subscribe(function () {})).to.equal(signal);
        });

    });

    describe(".unsubscribe(listener)", function () {

        it("should stop subscribeing the given listener", function () {
            var a = sinon.spy(),
                b = sinon.spy();

            signal.subscribe(a);
            signal.subscribe(b);
            signal.unsubscribe(a);
            signal.unsubscribe(b);
            signal("hello");

            expect(a).to.not.have.been.called;
            expect(b).to.not.have.been.called;
        });

        it("should also remove the given signals", function () {
            var otherSignal1 = new Signal("hi"),
                otherSignal2 = new Signal("hi");

            signal.subscribe(otherSignal1);
            signal.subscribe(otherSignal2);
            signal.unsubscribe(otherSignal1);
            signal.unsubscribe(otherSignal2);

            signal("hello");
            expect(otherSignal1()).to.equal("hi");
            expect(otherSignal1()).to.equal("hi");
        });

        it("should not remove other listeners", function () {
            var a = sinon.spy(),
                b = sinon.spy();

            signal.subscribe(a);
            signal.subscribe(b);
            signal.unsubscribe(a);
            signal("hello");

            expect(b).to.have.been.called;
        });

        it("should do nothing if the supplied listener has never been added", function () {
            expect(function () {
                signal.unsubscribe(function () {});
            }).to.not.throw();
        });

        it("should be possible to call unsubscribe on a signal after it has been disposed", function () {
            var a = sinon.spy();

            signal.subscribe(a);
            signal.dispose();
            signal.unsubscribe(a);
        });

        it("should be chainable", function () {
            function a() {}

            signal.subscribe(a);

            expect(signal.unsubscribe(a)).to.equal(signal);
        });

    });

    describe(".trigger()", function () {

        it("should manually notify all listeners", function () {
            var a = sinon.spy();

            signal("hi");
            signal.subscribe(a);
            signal.trigger();

            expect(a).to.have.been.calledOnce;
            expect(a).to.have.been.calledWith("hi", "hi", signal);
        });

        it("should be chainable", function () {
            expect(signal.trigger()).to.equal(signal);
        });

    });

    describe(".dispose()", function () {

        it("should delete the internal value", function () {
            var obj = {};

            signal(obj);
            signal.dispose();

            expect(signal()).to.equal(null);
        });

        it("should remove all listeners", function () {
            var a = sinon.spy(),
                b = sinon.spy();

            signal.subscribe(a, b);
            signal.dispose();
            signal(true);

            expect(a).to.not.have.been.called;
            expect(b).to.not.have.been.called;
        });

    });

});