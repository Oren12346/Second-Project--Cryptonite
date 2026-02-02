import "./MaxCoinsDialog.css";

type Props = {
  isOpen: boolean;
  addCoinId: string; // the coin the user tried to add
  selectedIds: string[]; // exactly the 5 currently selected
  onConfirm: (removeId: string) => void;
  onCancel: () => void;
};

export default function MaxCoinsDialog({
  isOpen,
  addCoinId,
  selectedIds,
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  // Important: prevent closing by clicking outside / Esc (project requirement)
  return (
    <div className="maxDialogOverlay" role="dialog" aria-modal="true">
      <div className="maxDialog">
        <div className="maxDialog__header">
          <h3 className="maxDialog__title">Maximum Coins Reached</h3>
        </div>

        <p className="maxDialog__text">
          You can select up to 5 coins. To add <strong>{addCoinId}</strong>,
          please choose one coin to remove:
        </p>

        <div className="maxDialog__list">
          {selectedIds.map((id) => (
            <button
              key={id}
              className="maxDialog__item"
              type="button"
              onClick={() => onConfirm(id)}
            >
              Remove: {id}
            </button>
          ))}
        </div>

        <div className="maxDialog__actions">
          <button className="maxDialog__btn" type="button" onClick={onCancel}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}