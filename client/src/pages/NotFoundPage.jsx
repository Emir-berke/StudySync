import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="card narrow">
      <h1>Page not found</h1>
      <p>
        <Link to="/sessions">Back to your sessions</Link>
      </p>
    </section>
  )
}
