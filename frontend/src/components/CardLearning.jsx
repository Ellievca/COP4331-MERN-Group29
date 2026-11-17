import { useRef, useState } from 'react';
import { useAuth } from '../state/AuthContext.jsx';
import { imageUrl, uploadImage } from '../services/reviews.js';
import { clozeText } from '../../../shared/study.js';

export function Diagram({ card, revealed = false, onMasks }) {
  const start = useRef(null),
    [preview, setPreview] = useState(null);
  if (!card.imageId) return null;
  const point = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) * 100) / r.width)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) * 100) / r.height)),
    };
  };
  const rect = (a, b) => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  });
  return (
    <div className={`diagram ${onMasks ? 'diagram-editor' : ''}`}>
      <img
        src={imageUrl(card.imageId)}
        alt={onMasks ? 'Diagram to cover with recall masks' : 'Study diagram'}
      />
      {(!revealed || onMasks) && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label={onMasks ? 'Drag to cover a label' : 'Hidden diagram labels'}
          onPointerDown={
            onMasks
              ? (e) => {
                  start.current = point(e);
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              : undefined
          }
          onPointerMove={
            onMasks
              ? (e) => {
                  if (start.current) setPreview(rect(start.current, point(e)));
                }
              : undefined
          }
          onPointerUp={
            onMasks
              ? (e) => {
                  if (!start.current) return;
                  const mask = rect(start.current, point(e));
                  start.current = null;
                  setPreview(null);
                  if (mask.width >= 0.5 && mask.height >= 0.5 && (card.masks || []).length < 20)
                    onMasks([...(card.masks || []), mask]);
                }
              : undefined
          }
        >
          {[...(card.masks || []), ...(preview ? [preview] : [])].map((mask, i) => (
            <rect key={i} {...mask} fill="#7653b5" opacity={onMasks ? 0.65 : 1} />
          ))}
        </svg>
      )}
    </div>
  );
}
export function CardPrompt({ card, revealed = false }) {
  return (
    <>
      <p className="recall-content">
        {card.kind === 'cloze'
          ? clozeText(card.front, revealed)
          : revealed
            ? card.back
            : card.front}
      </p>
      <Diagram card={card} revealed={revealed} />
      {revealed && card.kind === 'cloze' && <p>{card.back}</p>}
      {revealed && card.explanation && (
        <aside className="recall-explanation">
          <strong>Why / example</strong>
          <p>{card.explanation}</p>
        </aside>
      )}
    </>
  );
}
export function CardLearningFields({ fields, setFields, busy }) {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false),
    [error, setError] = useState('');
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const imageId = await uploadImage(session, file);
      setFields((current) => ({ ...current, imageId, masks: [] }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <>
      <div className="field">
        <label htmlFor="card-kind">Card type</label>
        <select
          id="card-kind"
          value={fields.kind || 'basic'}
          disabled={busy || uploading}
          onChange={(e) => setFields({ ...fields, kind: e.target.value })}
        >
          <option value="basic">Question and answer</option>
          <option value="cloze">Fill in the blank (cloze)</option>
          <option value="diagram">Diagram with hidden labels</option>
          <option value="application">Application / explain why</option>
        </select>
      </div>
      {fields.kind === 'cloze' && (
        <p className="field-help">
          In the question, write a sentence such as: React uses {'{{c1::components}}'} to build
          interfaces. Hidden text is revealed with the answer.
        </p>
      )}
      {fields.kind === 'application' && (
        <p className="field-help">
          Use a scenario in the question. Put the solution in the answer, and explain why it works
          below.
        </p>
      )}
      <div className="field">
        <label htmlFor="card-explanation">Explanation or worked example (optional)</label>
        <textarea
          id="card-explanation"
          maxLength={1500}
          rows={3}
          value={fields.explanation || ''}
          disabled={busy}
          onChange={(e) => setFields({ ...fields, explanation: e.target.value })}
        />
      </div>
      {fields.kind === 'diagram' && (
        <>
          <div className="field">
            <label htmlFor="card-image">Diagram image (PNG, JPEG, WebP; up to 2 MB)</label>
            <input
              id="card-image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy || uploading}
              onChange={upload}
            />
          </div>
          {uploading && <p role="status">Uploading diagram…</p>}
          {error && <p role="alert">{error}</p>}
          <Diagram card={fields} onMasks={(masks) => setFields({ ...fields, masks })} />
          {fields.imageId && (
            <>
              <p className="field-help">
                Drag over a label to hide it, or add a centered mask and adjust its coordinates.
                Maximum 20 masks.
              </p>
              <div className="button-group">
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy || (fields.masks || []).length >= 20}
                  onClick={() =>
                    setFields({
                      ...fields,
                      masks: [...(fields.masks || []), { x: 35, y: 40, width: 30, height: 15 }],
                    })
                  }
                >
                  Add mask
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy || !fields.masks?.length}
                  onClick={() => setFields({ ...fields, masks: fields.masks.slice(0, -1) })}
                >
                  Undo last mask
                </button>
              </div>
              {fields.masks?.length > 0 && (
                <div className="mask-controls">
                  {['x', 'y', 'width', 'height'].map((key) => (
                    <label key={key}>
                      Last mask {key} (%)
                      <input
                        type="number"
                        min={key === 'x' || key === 'y' ? 0 : 0.5}
                        max={100}
                        step="0.5"
                        value={fields.masks.at(-1)[key]}
                        onChange={(e) =>
                          setFields({
                            ...fields,
                            masks: fields.masks.map((m, i) =>
                              i === fields.masks.length - 1
                                ? { ...m, [key]: Number(e.target.value) }
                                : m,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
