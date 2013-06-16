"use strict";

var chai = require("chai"),
    Signal = require("../" + require("../package.json").main),
    EventEmitter = require("events").EventEmitter,
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("Signal", function () {
    var signal;

    beforeEach(function () {
        signal = new Signal();
    });

    it("should be an instance of Signal", function () {
        expect(signal).to.be.an.instanceof(Signal);
    });

    it("should be an instance of EventEmitter", function () {
        expect(signal).to.be.an.instanceof(EventEmitter);
    });

    describe(".get() when no data has been set yet", function () {

        it("should return undefined", function () {
            expect(signal.get()).to.be.an("undefined");
        });

    });

    describe(".set()", function () {

        it("should return this", function () {
            expect(signal.set("hello")).to.equal(signal);
        });

    });

    describe(".get() when there has already been data set", function () {

        beforeEach(function () {
            signal.set("Ahoy!");
        });

        it("should return the last set data", function () {
            var obj = {};

            expect(signal.get()).to.equal("Ahoy!");
            signal.set("Arrr!");
            expect(signal.get()).to.equal("Arrr!");
            signal.set(true);
            expect(signal.get()).to.equal(true);
            signal.set(obj);
            expect(signal.get()).to.equal(obj);
        });

    });

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