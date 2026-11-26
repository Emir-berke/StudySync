import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Renders a component inside a router at the given path.
export function renderAt(ui, path = '/') {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)
}
