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

    it("should return a new signal with the given value", function () {
        expect(new Signal("hello")()).to.equal("hello");
    });

    describe(".totalListeners: Number", function () {
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
            signal1.notify(listener, function () {});
            signal2.notify(listener, listener, function () {});

            expect(Signal.totalListeners).to.equal(5);
        });

        it("should decrease by the number of listeners that have been removed on an instance", function () {
            signal1.unnotify(listener);
            signal2.unnotify(listener);

            expect(Signal.totalListeners).to.equal(2);
        });

        it("should decrease by the number of listeners that have been disposed", function () {
            signal1.dispose();
            signal2.dispose();

            expect(Signal.totalListeners).to.equal(0);
        });

    });

    describe(".use(plugin: Function, config: Object?): Signal", function () {
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

        it("should apply the same plugin only once", function () {
            Signal.use(plugin, config);
            Signal.use(plugin, config);
            expect(plugin).to.have.been.calledOnce;
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

    describe(".notify(listener1: Function, listener2: Function, ...): Signal", function () {

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

        it("should only call the listeners when the value actually changes", function () {
            var a = sinon.spy();

            signal.notify(a);

            signal(true);
            signal(true);

            expect(a).to.have.been.calledOnce;
        });

        it("should call the listeners with a proper change event-object containing the target, oldValue and newValue", function (done) {
            signal(false);
            signal.notify(function (event) {
                expect(event).to.eql({
                    type: "change",
                    target: signal,
                    oldValue: false,
                    newValue: true
                });
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

    describe(".unnotify(listener1: Function, listener2: Function, ...): Signal", function () {

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

        it("should also work if the given listener has been added more than once", function () {
            var listener = sinon.spy();

            signal.notify(listener, listener, listener);
            signal.unnotify(listener);
            signal("hello");

            expect(listener).to.not.have.been.called;
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

    describe(".setter: Function", function () {

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
            var actualEvent;

            signal.setter = function () {
               return "hey";
            };

            signal.notify(function (event) {
                actualEvent = event;
            });

            signal("ho");
            expect(signal()).to.equal("hey");
            expect(actualEvent.newValue).to.equal("hey");
        });

    });

    describe(".dispose(): undefined", function () {

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