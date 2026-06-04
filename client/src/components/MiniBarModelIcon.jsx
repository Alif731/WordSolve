import "../sass/components/MiniBarModelIcon.scss";
export const MiniBarModelIcon = ({ className = "" }) => {
  return (
    <div className={`mini-barmodel-icon ${className}`}>
      {/* Top Row: The Long "End" Block */}
      <div className="mini-barmodel-icon__row">
        <div className="mini-block mini-block--green"></div>
      </div>

      {/* Bottom Row: The "Start" and "Change" Blocks */}
      <div className="mini-barmodel-icon__row">
        <div className="mini-block mini-block--blue"></div>
        <div className="mini-block mini-block--yellow"></div>
      </div>
    </div>
  );
};
