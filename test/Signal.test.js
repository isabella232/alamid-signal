"use strict";

var chai = require("chai");
var sinon = require("sinon");
var Signal = require("../" + require("../package.json").main);
var expect = chai.expect;

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
        var signal1;
        var signal2;

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
            signal1.pipe(listener);
            signal1.pipe(listener);
            signal1.pipe(listener);
            signal1.pipe(function () {});
            signal1.pipe(function () {});

            expect(Signal.totalListeners).to.equal(5);
        });

        it("should decrease by the number of listeners that have been removed on an instance", function () {
            signal1.unpipe(listener);
            expect(Signal.totalListeners).to.equal(4);
            signal2.unpipe(listener); // has never been added as listener
            expect(Signal.totalListeners).to.equal(4);
        });

        it("should decrease by the number of listeners that have been disposed", function () {
            signal1.dispose();
            signal2.dispose();

            expect(Signal.totalListeners).to.equal(0);
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

    describe(".transform", function () {

        it("should be called when a new value is set", function () {
            signal.transform = sinon.spy();
            signal("hey ho");

            expect(signal.transform).to.have.been.called;
        });

        it("should be called with the new value", function () {
            signal.transform = sinon.spy();
            signal("hey ho");

            expect(signal.transform).to.have.been.calledWith("hey ho");
        });

        it("should be called before the new value is set", function (done) {
            signal.transform = function () {
                expect(signal()).to.equal(undefined);
                done();
            };

            signal("hello");
        });

        it("should override the new value", function () {
            var value;

            signal.transform = function () {
               return "hey";
            };

            signal.pipe(function (newValue) {
                value = newValue;
            });

            signal("ho");
            expect(signal()).to.equal("hey");
            expect(value).to.equal("hey");
        });

    });

    describe(".readOnly", function () {

        it("should be false by default", function () {
            expect(signal.readOnly).to.equal(false);
        });
        
        describe("when set to true", function () {
            
            beforeEach(function () {
                signal.readOnly = true; 
            });
            
            it("should not be possible to set the value by invoking the signal", function () {
                signal("new value");
                expect(signal()).to.equal(undefined);
            });

            it("should still be possible to pipe a value to the signal", function () {
               var otherSignal = new Signal();

                otherSignal.pipe(signal);
                otherSignal("new value");
                expect(signal()).to.equal("new value");
            });
            
        });
        
    });

    describe(".pipe(listener)", function () {
        var otherSignal;

        beforeEach(function () {
            otherSignal = new Signal();
        });

        it("should add the given function as listener to the current signal", function () {
            signal.pipe(otherSignal);
            signal("hello otherSignal");

            expect(otherSignal()).to.equal("hello otherSignal");
        });

        it("should be possible to chain multiple signals", function () {
            var anotherSignal = new Signal();

            function add(num) {
                return num + 1;
            }

            otherSignal.transform = add;
            anotherSignal.transform = add;

            signal.pipe(otherSignal).pipe(anotherSignal);
            signal(0);

            expect(otherSignal()).to.equal(1);
            expect(anotherSignal()).to.equal(2);
        });

        it("should reflect already the new value when the change occurred", function (done) {
            signal.pipe(function () {
                expect(signal()).to.equal("What up?");
                done();
            });
            signal("What up?");
        });

        it("should not trigger if the new value and the old value are both primitives and equal", function () {
            var listener = sinon.spy();

            signal.pipe(listener);
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
            var listener = sinon.spy();
            var arr = [];
            var func = function () {};
            var regex = /asd/;
            var obj = {};

            signal.pipe(listener);
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

    });
    
    describe(".unpipe(listener)", function () {

        it("should stop notifying the given listener", function () {
            var a = sinon.spy();
            var b = sinon.spy();

            signal.pipe(a);
            signal.pipe(b);
            signal.unpipe(a);
            signal.unpipe(b);
            signal("hello");

            expect(a).to.not.have.been.called;
            expect(b).to.not.have.been.called;
        });

        it("should not remove other listeners", function () {
            var a = sinon.spy();
            var b = sinon.spy();

            signal.pipe(a);
            signal.pipe(b);
            signal.unpipe(a);
            signal("hello");

            expect(b).to.have.been.called;
        });

        it("should do nothing if the supplied listener has never been added", function () {
            expect(function () {
                signal.unpipe(function () {});
            }).to.not.throw();
        });

        it("should be possible to call unpipe() on a signal after it has been disposed", function () {
            var a = sinon.spy();

            signal.pipe(a);
            signal.dispose();
            signal.unpipe(a);
        });

        it("should be possible to unpipe multiple signals", function () {
            var otherSignal = new Signal();

            signal.pipe(otherSignal);
            expect(signal.unpipe(otherSignal)).to.equal(otherSignal);
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
            var a = sinon.spy();
            var b = sinon.spy();

            signal.pipe(a);
            signal.pipe(b);
            signal.dispose();
            signal(true);

            expect(a).to.not.have.been.called;
            expect(b).to.not.have.been.called;
        });

    });

});