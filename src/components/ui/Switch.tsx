interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'flex h-7 w-[50px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-pink-light',
        checked ? 'justify-end bg-lime' : 'justify-start bg-card-2',
      ].join(' ')}
    >
      <span
        className={['h-[22px] w-[22px] rounded-full transition-colors duration-200', checked ? 'bg-bg-deep' : 'bg-text-2'].join(
          ' ',
        )}
      />
    </button>
  );
}
