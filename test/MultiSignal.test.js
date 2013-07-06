"use strict";

var chai = require("chai"),
    MultiSignal = require("../lib/MultiSignal.js"),
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("MultiSignal", function () {
    var multiSignal,
        givenValue;

    function Signal() {
        function signal(value) {
            givenValue = value;
        }
        signal.constructor = Signal;

        return signal;
    }

    before(function () {
        MultiSignal.prototype.Signal = Signal;
    });
    beforeEach(function () {
        multiSignal = new MultiSignal(Signal);
    });
    after(function () {
        delete MultiSignal.prototype.Signal;
    });

    it("should be an instance of MultiSignal", function () {
        expect(multiSignal).to.be.an.instanceof(MultiSignal);
    });

    describe(".get() before data has been set", function () {

        it("should return an empty object", function () {
            expect(multiSignal.get()).to.be.empty;
        });

    });

    describe(".get(key) before data has been set", function () {

        it("should return undefined", function () {
            expect(multiSignal.get("name")).to.be.undefined;
        });

    });

    describe(".set(object)", function () {

        it("should return this", function () {
            expect(multiSignal.set({ type: "Pirate" })).to.equal(multiSignal);
        });

    });

    describe(".set(key, value)", function () {

        it("should return this", function () {
            expect(multiSignal.set("hello", true)).to.equal(multiSignal);
        });

    });

    describe(".get() after data has been set", function () {
        var data;

        beforeEach(function () {
            data = {
                greeting: "Ahoy!",
                age: 34,
                attributes: {}
            };
            multiSignal.set(data);
        });

        it("should return all data set", function () {
            expect(multiSignal.get()).to.deep.equal(data);

            data.type = "Pirate";
            data.greeting = "Arr!";
            multiSignal.set(data);

            expect(multiSignal.get()).to.deep.equal(data);
        });

    });

    describe(".get(key) after data has been set", function () {

        beforeEach(function () {
            multiSignal.set("greeting", "Ahoy!");
            multiSignal.set("age", 34);
        });

        it("should return the stored value", function () {
            expect(multiSignal.get("greeting")).to.equal("Ahoy!");
            expect(multiSignal.get("age")).to.equal(34);
        });

        it("should still return undefined for unset keys", function () {
            expect(multiSignal.get("victims")).to.equal(undefined);
        });

    });

    describe(".provide(key)", function () {

        it("should return a signal", function () {
            var instance = multiSignal.provide("greeting");

            expect(instance).to.be.an("function");
            expect(instance.constructor).to.equal(Signal);
        });

        it("should return the same signal instance multiple times", function () {
            var instance;

            instance = multiSignal.provide("greeting");
            expect(multiSignal.provide("greeting")).to.equal(instance);
        });

        it("should return a signal representing the value specified by key", function () {
            var greeting = multiSignal.provide("greeting");

            expect(greeting()).to.equal(undefined);
            multiSignal.set("greeting", "Ahoy!");
            expect(givenValue).to.equal("Ahoy!");
        });

    });

});