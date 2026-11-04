import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createAction } from '@reduxjs/toolkit';

const require = createRequire(import.meta.url);
// Compile the real TypeScript modules in memory; substitute only external IO.
function loadSource(path, dependencies = {}) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    const resolve = (name) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name);
    new Function('require', 'exports', 'module', code)(resolve, module.exports, module);
    return module.exports;
}
const helpers = loadSource('../src/components/todo/todoHelpers.ts');
const logout = createAction('auth/logout');
const slice = loadSource('../src/store/todosSlice.ts', {
    './authSlice': { logout },
    '../api/errors': { getApiErrorMessage: () => 'Request failed' },
    '../api/todoService': {},
});
const reducer = slice.default;
const page = (id) => ({ items: [{ id }], page: 0, size: 10, totalElements: 1, totalPages: 1, total: 1, completed: 0, categories: [] });
const valid = { title: 'Task', description: '', priority: 'MEDIUM', category: 'General', dueDate: '' };

test('forms reject whitespace and overlong values, accept the exact limit', () => {
    assert.equal(Object.keys(helpers.validateTodo(valid)).length, 0);
    assert.ok(helpers.validateTodo({ ...valid, title: '   ' }).title);
    assert.ok(helpers.validateTodo({ ...valid, category: '\t' }).category);
    for (const field of ['title', 'description', 'category']) {
        assert.equal(helpers.validateTodo({ ...valid, [field]: 'x'.repeat(255) })[field], undefined);
        assert.ok(helpers.validateTodo({ ...valid, [field]: 'x'.repeat(256) })[field]);
    }
});
test('Turkish category variants share the same key', () => {
    assert.equal(helpers.categoryKey('  \u0130\u015f   Notlar\u0131 '), helpers.categoryKey('i\u015f notlar\u0131'));
});
test('an older list response cannot overwrite a newer response', () => {
    let state = reducer(undefined, slice.fetchTodos.pending('old'));
    state = reducer(state, slice.fetchTodos.pending('new'));
    state = reducer(state, slice.fetchTodos.fulfilled(page(2), 'new'));
    state = reducer(state, slice.fetchTodos.fulfilled(page(1), 'old'));
    assert.equal(state.items[0].id, 2);
});
test('changing query resets page and invalidates pending response', () => {
    let state = reducer(undefined, slice.setQuery({ page: 4 }));
    state = reducer(state, slice.fetchTodos.pending('old'));
    state = reducer(state, slice.setQuery({ search: 'new' }));
    state = reducer(state, slice.fetchTodos.fulfilled(page(1), 'old'));
    assert.equal(state.query.page, 0);
    assert.equal(state.items.length, 0);
});
test('logout rejects late list and write responses', () => {
    for (const action of [slice.fetchTodos, slice.addTodo]) {
        let state = reducer(undefined, action.pending('old'));
        state = reducer(state, logout());
        state = reducer(state, action.fulfilled(page(1), 'old'));
        assert.deepEqual(state, reducer(undefined, { type: 'init' }));
    }
});
test('failed write exposes error and does not request refresh', () => {
    let state = reducer(undefined, slice.addTodo.pending('write'));
    state = reducer(state, slice.addTodo.rejected(null, 'write', valid, 'Failure'));
    assert.equal(state.error, 'Failure');
    assert.equal(state.errorSource, 'mutation');
    assert.equal(state.activeMutationId, null);
    assert.equal(state.revision, 0);
});
test('successful writes trigger refresh only for the active request', () => {
    let state = reducer(undefined, slice.removeTodo.pending('active', 1));
    state = reducer(state, slice.removeTodo.fulfilled(1, 'old', 1));
    assert.equal(state.revision, 0);
    state = reducer(state, slice.removeTodo.fulfilled(1, 'active', 1));
    assert.equal(state.revision, 1);
    assert.equal(state.activeMutationId, null);
});
test('active writes prevent filter and page changes', () => {
    let state = reducer(undefined, slice.saveTodo.pending('write'));
    const before = state;
    state = reducer(state, slice.setQuery({ page: 2 }));
    state = reducer(state, slice.setFilter('completed'));
    assert.deepEqual(state, before);
});
