// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;
const Cache = importModule('Cache');
const cache = new Cache('my_words_list');
cache.write('vamsi', 'this is my name');
// const widget = createWidget('vamsi and what is that is done');// 
// Script.setWidget(widget);
Script.complete();