import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty card" style={{ marginTop: 32 }}>
      <h1>Match not on the board</h1>
      <p className="muted">
        It may have rolled off today&apos;s scoreboard. Scoreboards refresh every 15 minutes.
      </p>
      <Link href="/" className="btn btn--copy">Back to the live desk</Link>
    </div>
  );
}
