import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveFineDocuments, getFineDocuments } from '../src/fineDocuments.js';

test('legacy fine and multiple attachments remain individually accessible', () => {
  const fine = { created_by: 'admin', photo_path: 'admin/driver-fines/old.webp', photo_name: 'old.webp', attachments: [{path:'admin/driver-fines/second.pdf'}, {path:'other/driver-fines/private.webp'}, {path:'admin/driver-fines/old.webp'}] };
  assert.deepEqual(getFineDocuments(fine).map(document=>document.path), ['admin/driver-fines/old.webp','admin/driver-fines/second.pdf']);
});

test('sequential uploads produce a single fine with all files', async () => {
  let writes = 0;
  const result = await archiveFineDocuments({files:['photo','pdf'],prepare:async file=>file,upload:async file=>({path:file}),remove:async()=>assert.fail('unexpected cleanup'),persist:async documents=>{ writes++; return documents; }});
  assert.equal(writes,1);
  assert.deepEqual(result,[{path:'photo'},{path:'pdf'}]);
});

test('failed upload or row insert cleans up the whole uploaded batch', async () => {
  for (const failInsert of [false,true]) {
    const removed=[];
    await assert.rejects(archiveFineDocuments({files:['photo','pdf'],prepare:async file=>file,upload:async file=>{if(file==='pdf'&&!failInsert)throw Error('upload failed');return{path:file};},remove:async paths=>removed.push(...paths),persist:async()=>{throw Error('insert failed');}}),/failed/);
    assert.deepEqual(removed,failInsert?['photo','pdf']:['photo']);
  }
});
