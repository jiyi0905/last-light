export function StellarScene({
  variant = "home",
}: {
  variant?: "home" | "ark" | "book";
}) {
  return (
    <div className={`stellar-scene scene-${variant}`} aria-hidden="true">
      <div className="scene-grid" />
      <span className="coordinate coordinate-top">SOL / 00.001</span>
      <span className="coordinate coordinate-bottom">
        DEEP SPACE OBSERVATORY
      </span>
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="stellar-halo" />
      <div className="stellar-body" />
      <div className="scene-axis" />
      <div className="scene-dot dot-one" />
      <div className="scene-dot dot-two" />
      <div className="star star-one" />
      <div className="star star-two" />
      <div className="star star-three" />
      <div className="scene-caption">
        <span className="tiny-square" /> SIGNAL RECEIVED <span>2847.09.16</span>
      </div>
    </div>
  );
}
