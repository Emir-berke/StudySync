// Shows an ApiError (or any object with message + fieldErrors) as an alert.
export default function ErrorMessage({ error }) {
  if (!error) return null

  const fieldErrors = error.fieldErrors ?? []

  return (
    <div className="alert alert-error" role="alert">
      <p>{error.message}</p>
      {fieldErrors.length > 0 && (
        <ul>
          {fieldErrors.map((item, index) => (
            <li key={`${item.field}-${index}`}>{item.message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
