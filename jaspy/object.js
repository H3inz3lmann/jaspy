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

var object_id_counter = 0;

function PyObject(cls, dict) {
    this.cls = cls;
    this.identity = null;
    this.dict = dict === undefined ? {} : dict;
}

PyObject.prototype.get_id = function () {
    if (this.identity === null) {
        this.identity = object_id_counter++;
    }
    return this.identity;
};

PyObject.prototype.get_address = function () {
    return ('0000000000000' + this.get_id().toString(16)).substr(-13);
};

PyObject.prototype.call = function (name, args, kwargs) {
    var method = this.cls.lookup(name);
    if (method) {
        if (isinstance(method, py_classmethod)) {
            return call(method.func, [this.cls].concat(args || []), kwargs);
        } else if (isinstance(method, py_staticmethod)) {
            return call(method.func, args, kwargs);
        } else if (name == '__new__') {
            return call(method, [this.cls].concat(args || []), kwargs);
        }
        return call(method, [this].concat(args || []), kwargs);
    } else {
        vm.return_value = null;
        vm.last_exception = METHOD_NOT_FOUND;
        return false;
    }
};

PyObject.prototype.setattr = function (name, value) {
    if (!this.dict) {
        raise(TypeError, 'object does not support attribute access');
    }
    if (name instanceof PyStr) {
        name = name.value;
    } else if (typeof name != 'string') {
        raise(TypeError, 'native attribute name must be a string');
    }
    this.dict[name] = value;
};

PyObject.prototype.getattr = function (name) {
    if (!this.dict) {
        raise(TypeError, 'object does not support attribute access');
    }
    if (name instanceof PyStr) {
        name = name.value;
    } else if (typeof name != 'string') {
        raise(TypeError, 'native attribute name must be a string');
    }
    return this.dict[name]
};

PyObject.prototype.is = function (other) {
    return this === other;
};

PyObject.prototype.check_type = function (cls, message) {
    if (!isinstance(this, cls)) {
        raise(TypeError, message || 'native type check failed');
    }
};

PyObject.prototype.check_subclass = function (superclass, message) {
    if (!(this instanceof PyType) || !issubclass(this, superclass)) {
        raise(TypeError, message || 'native subclass check failed');
    }
};

PyObject.prototype.repr = function () {
    return '<object at 0x' + this.get_address() + '>';
};

PyObject.prototype.toString = PyObject.prototype.repr;


function isinstance(object, cls) {
    var index;
    for (index = 0; index < object.cls.mro.length; index++) {
        if (object.cls.mro[index] === cls) {
            return true;
        }
    }
    return false;
}


$.PyObject = PyObject;

$.isinstance = isinstance;
