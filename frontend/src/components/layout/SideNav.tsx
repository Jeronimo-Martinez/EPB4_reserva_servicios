interface NavItem {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

interface SideNavProps {
  items: NavItem[];
  active: string;
}

export default function SideNav({ items, active }: SideNavProps) {
  return (
    <nav className="w-[210px] shrink-0 flex flex-col gap-1">
      {items.map((item) => {
        const isActive = item.label === active;
        return (
          <div
            key={item.label}
            onClick={item.onClick}
            className={`flex items-center gap-3 px-4 py-[10px] rounded-[8px] cursor-pointer transition-colors
              ${isActive
                ? "bg-[#e6f0ef] text-[#005146]"
                : "text-[#66716c] hover:bg-[#f2f3ee] hover:text-[#18211e]"
              }`}
          >
            <span className={isActive ? "text-[#005146]" : ""}>{item.icon}</span>
            <span
              className={`text-[14px] ${isActive ? "font-semibold text-[#005146]" : "font-medium"}`}
              style={{
                fontFamily: isActive
                  ? '"Inter:Semi Bold", sans-serif'
                  : '"Inter:Medium", sans-serif',
              }}
            >
              {item.label}
            </span>
            {isActive && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#005146]" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
