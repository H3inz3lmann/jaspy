/*
 * Copyright (C) 2016, Maximilian Koehl <mail@koehlma.de>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */


function error(message) {
    throw new Error('[FATAL ERROR] ' + (message || 'fatal interpreter error'));
}

function raise(exc_type, exc_value, exc_tb) {
    error('exception occurred before jaspy has been fully initialized');
}

function assert(condition, message) {
    if (!condition) {
        error(message || 'assertion failed');
    }
}

function update(target, source) {
    var name, value;
    for (name in source) {
        if (source.hasOwnProperty(name)) {
            target[name] = source[name];
        }
    }
}


function Class(attributes, superclass) {
    var constructor = attributes.constructor;
    if (superclass) {
        constructor.prototype = Object.create(superclass.prototype);
    }
    update(constructor.prototype, attributes);
    constructor.superclass = superclass;
    constructor.extend = function (attributes) {
        return Class(attributes, constructor);
    };
    return constructor;
}

Class.extend = function (attributes) {
    return Class(attributes);
};


function $Class(name, attributes, bases) {
    var constructor = Class(attributes, PyObject);
    constructor.cls = $class(name, bases);
    constructor.check = function (object) {
        if (!(object instanceof constructor)) {
            raise(TypeError, 'expected ' + name);
        }
    };
    constructor.$def = constructor.cls.$def.bind(constructor.cls);

    constructor.$map = function (name, spec, options) {
        var args, index;
        options = options || {};
        options.simple = true;
        spec = spec || [];
        args = new Array(spec.length);
        for (index = 0; index < spec.length; index++) {
            args[index] = ('arg' + index);
        }
        var source = "" +
            "(function (" + (['self'].concat(args)).join(', ') + ") {" +
            "   if (!(self instanceof constructor)) {" +
            "       raise(TypeError, 'invalid type of self in native method call');" +
            "   }" +
            "   return self." + name + "(" + args.join(', ') + ");" +
            "})";
        constructor.cls.$def(name, eval(source), spec, options);
    };
    return constructor;
}


$.error = error;
$.raise = raise;
$.assert = assert;
$.assign = update;

$.Class = Class;
