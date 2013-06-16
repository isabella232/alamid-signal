"use strict";

var chai = require("chai"),
    Signal = require("../lib/Signal.js"),
    SuperSignal = require("../lib/SuperSignal.js"),
    EventEmitter = require("events").EventEmitter,
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("SuperSignal", function () {
    var signal;

    beforeEach(function () {
        signal = new SuperSignal();
    });

    it("should be an instance of SuperSignal", function () {
        expect(signal).to.be.an.instanceof(SuperSignal);
    });

    describe(".get() before data has been set", function () {

        it("should return an empty object", function () {
            expect(signal.get()).to.be.empty;
        });

    });

    describe(".get(key) before data has been set", function () {

        it("should return undefined", function () {
            expect(signal.get("name")).to.be.undefined;
        });

    });

    describe(".set(object)", function () {

        it("should return this", function () {
            expect(signal.set({ type: "Pirate" })).to.equal(signal);
        });

    });

    describe(".set(key, value)", function () {

        it("should return this", function () {
            expect(signal.set("hello", true)).to.equal(signal);
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
            signal.set(data);
        });

        it("should return all data set", function () {
            expect(signal.get()).to.deep.equal(data);

            data.type = "Pirate";
            data.greeting = "Arr!";
            signal.set(data);

            expect(signal.get()).to.deep.equal(data);
        });

    });

    describe(".get(key) after data has been set", function () {

        beforeEach(function () {
            signal.set("greeting", "Ahoy!");
            signal.set("age", 34);
        });

        it("should return the stored value", function () {
            expect(signal.get("greeting")).to.equal("Ahoy!");
            expect(signal.get("age")).to.equal(34);
        });

        it("should still return undefined for unset keys", function () {
            expect(signal.get("victims")).to.equal(undefined);
        });

    });

    describe(".provide(key)", function () {

        it("should return a signal", function () {
            expect(signal.provide("greeting")).to.be.an.instanceof(Signal);
        });

        it("should return the same signal instance multiple times", function () {
            var instance;

            instance = signal.provide("greeting");
            expect(signal.provide("greeting")).to.equal(instance);
        });

        it("should return a signal representing the value specified by key", function (done) {
            var greeting = signal.provide("greeting");

            expect(greeting.get()).to.equal(undefined);
            greeting.on("change", function (event) {
                expect(event.oldValue).to.equal(undefined);
                expect(event.newValue).to.equal("Ahoy!");
                done();
            });
            signal.set("greeting", "Ahoy!");
        });

    });

    return;

    describe(".on('change')", function () {

        it("should be emitted by calling .set()", function (done) {
            signal.on("change", function () {
                done();
            });
            signal.set("La vie en rose");
        });

        it("should call the handler with an event-object containing the oldValue, newValue, name, target", function (done) {
            signal.set("Ahoy!");
            signal.on("change", function (event) {
                expect(event.name).to.equal("change");
                expect(event.target).to.equal(signal);
                expect(event.oldValue).to.equal("Ahoy!");
                expect(event.newValue).to.equal("What up?");
                done();
            });
            signal.set("What up?");
        });

        it("should already reflect the new value when the change event occurs", function (done) {
            signal.on("change", function () {
                expect(signal.get()).to.equal("What up?");
                done();
            });
            signal.set("What up?");
        });

    });

});