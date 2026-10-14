import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateProject } from '../src/project.js';
import { root } from './helpers.js';

const referenceRoot = join(root, 'skills/draw-authoring/references');
for (const file of readdirSync(referenceRoot).filter(name => name.endsWith('.md')).sort()) {
  const contents = readFileSync(join(referenceRoot, file), 'utf8');
  const fragments = [...contents.matchAll(/```json\s*\n([\s\S]*?)```/g)];
  for (const [index, fragment] of fragments.entries()) {
    test(`craft reference ${file} JSON fragment ${index + 1} matches actual schema`, () => {
      const value = JSON.parse(fragment[1]);
      const layer = ['linear', 'radial'].includes(value.type)
        ? { name: 'gradient example', type: 'ellipse', x: 32, y: 32, width: 192, height: 192, color: '#7856C7', fillGradient: value }
        : value;
      assert.doesNotThrow(() => validateProject({ version: 1, name: 'reference example', width: 256, height: 256, layers: Array.isArray(layer) ? layer : [layer] }));
    });
  }
}
for (const file of readdirSync(join(root, 'examples/styles')).filter(name => name.endsWith('.json')).sort()) {
  test(`style demonstration ${file} remains a bounded vector project`, () => {
    const value = JSON.parse(readFileSync(join(root, 'examples/styles', file), 'utf8'));
    const project = validateProject(value);
    assert.deepEqual([project.width, project.height], [256, 256]);
    assert.ok(project.layers.length <= 20);
    assert.ok(project.layers.every(layer => ['rectangle', 'ellipse', 'polygon', 'path', 'text'].includes(layer.type)));
  });
}
