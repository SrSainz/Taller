import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const storage = readFileSync(new URL("../src/supabase.js", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261012150000_net_expense_documents.sql", import.meta.url), "utf8");

test("la cámara destacada está antes de Cancelar y conserva la revisión editable", () => {
  const camera = app.indexOf('className="net-detail-card__form-camera"');
  const cancel = app.indexOf('className="net-detail-card__form-cancel" onClick={closeExpenseForm}');
  assert.ok(camera > 0 && cancel > camera);
  assert.match(app, /capture="environment"[^>]+onChange=\{handleExpensePhotoChange\}/);
  assert.match(app, /setFormState\(\(current\) => \(\{[\s\S]*?category: current\.category \|\| category\?\.label/);
  assert.match(app, /await onAddExpense\(\{[^}]*photoFile: expensePhotoFile, extraction: expenseExtraction/);
});

test("el justificante se archiva de forma privada y puede consultarse después", () => {
  assert.match(storage, /from\("net-expense-documents"\)\.upload\(photoPath, photoFile/);
  assert.match(storage, /photo_path: photoPath/);
  assert.match(app, /createCachedStorageUrl\(\{ bucket: "net-expense-documents", path: photo\.path/);
  assert.match(app, /Ver justificante/);
  assert.match(migration, /insert into storage\.buckets \(id, name, public/);
  assert.match(migration, /'net-expense-documents', 'net-expense-documents', false/);
  assert.match(migration, /alter table public\.net_expenses enable row level security/);
  assert.match(migration, /net_expense_documents_admin_select/);
});

test("el gasto y la foto se eliminan juntos", () => {
  assert.match(storage, /from\("net_expenses"\)\.delete\(\)\.eq\("id", expense\.id\)/);
  assert.match(storage, /from\("net-expense-documents"\)\.remove\(\[expense\.photo_path\]\)/);
});

test("la cámara de consulta aparece junto a la papelera solo si hay foto", () => {
  assert.match(app, /expense\.manualPhotos\?\.map\(\(photo, index\) => <button[^>]+className="net-detail-card__photo-action"/);
  const camera = app.indexOf('className="net-detail-card__photo-action"');
  const trash = app.indexOf('aria-label={`Eliminar gasto manual de ${expense.label}`}');
  assert.ok(camera > 0 && trash > camera);
  assert.match(app, /onClick=\{\(\) => openExpensePhoto\(photo\)\}/);
});
