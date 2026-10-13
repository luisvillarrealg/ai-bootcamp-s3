import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

// Mock server to intercept API requests for tasks
const server = setupServer(
  // GET /api/tasks handler
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, title: 'Test Task 1', description: 'Desc 1', due_date: '2025-09-30', completed: 0 },
        { id: 2, title: 'Test Task 2', description: 'Desc 2', due_date: '2025-10-01', completed: 1 },
      ])
    );
  }),

  // POST /api/tasks handler
  rest.post('/api/tasks', (req, res, ctx) => {
    const { title } = req.body;
    if (!title || title.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Task title is required' })
      );
    }
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        title,
        description: req.body.description || '',
        due_date: req.body.due_date || null,
        completed: 0,
      })
    );
  }),

  // PUT /api/tasks/:id handler
  rest.put('/api/tasks/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ ...req.body, id: Number(req.params.id), completed: 0 })
    );
  }),

  // PATCH /api/tasks/:id handler
  rest.patch('/api/tasks/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ id: Number(req.params.id), completed: req.body.completed ? 1 : 0 })
    );
  }),

  // DELETE /api/tasks/:id handler
  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    return res(ctx.status(204));
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TODO App', () => {
  test('renders the main UI', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('TODO App')).toBeInTheDocument();
    expect(screen.getByTestId('submit-task')).toBeInTheDocument();
      // Removed 'Tasks' assertion, as the header is 'TODO App'
  });

  test('loads and displays tasks', async () => {
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    let tasks = [
      { id: 1, title: 'Test Task 1', description: 'Desc 1', due_date: '2025-09-30', completed: 0 },
      { id: 2, title: 'Test Task 2', description: 'Desc 2', due_date: '2025-10-01', completed: 1 },
    ];
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(tasks));
      }),
      rest.post('/api/tasks', (req, res, ctx) => {
        const { title, description } = req.body;
        const newTask = {
          id: 3,
          title,
          description: description || '',
          due_date: req.body.due_date || null,
          completed: 0,
        };
        tasks = [...tasks, newTask];
        return res(ctx.status(201), ctx.json(newTask));
      })
    );
    const user = userEvent.setup();
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('title-input'), 'New Test Task');
    await user.type(screen.getByTestId('description-input'), 'Task description');
    await user.click(screen.getByTestId('submit-task'));
    await waitFor(() => {
      expect(screen.getByText(/New Test Task/i)).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.getByText('No tasks found.')).toBeInTheDocument();
    });
  });

  test('shows radio-style priority buttons with sketch colors and P3 fallback', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) =>
        res(ctx.json([
          { id: 1, title: 'High', priority: 'P1', completed: 0 },
          { id: 2, title: 'Legacy', completed: 0 },
        ]))
      )
    );
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => expect(screen.getAllByTestId('priority-P1')).toHaveLength(2));
    const [highP1, legacyP1] = screen.getAllByTestId('priority-P1');
    const [, legacyP3] = screen.getAllByTestId('priority-P3');
    expect(highP1).toHaveAttribute('aria-checked', 'true');
    expect(highP1).toHaveClass('priority-btn--selected');
    expect(legacyP1).toHaveAttribute('aria-checked', 'false');
    expect(legacyP1).not.toHaveClass('priority-btn--selected');
    expect(legacyP3).toHaveAttribute('aria-checked', 'true');
    expect(legacyP3).toHaveClass('priority-btn--selected');
  });

  test('saves a new priority when a priority button is clicked', async () => {
    let put;
    server.use(
      rest.get('/api/tasks', (req, res, ctx) =>
        res(ctx.json([{ id: 1, title: 'Task', description: 'd', due_date: null, priority: 'P3', completed: 0 }]))
      ),
      rest.put('/api/tasks/:id/priority', (req, res, ctx) => {
        put = req.body;
        return res(ctx.json({ id: 1, ...req.body, completed: 0 }));
      })
    );
    const user = userEvent.setup();
    await act(async () => {
      render(<App />);
    });
    await user.click(await screen.findByTestId('priority-P1'));
    await waitFor(() => expect(put).toEqual({ priority: 'P1' }));
  });

  test('sends default priority P3 when adding a task', async () => {
    let posted;
    server.use(
      rest.post('/api/tasks', (req, res, ctx) => {
        posted = req.body;
        return res(ctx.status(201), ctx.json({ id: 3, ...req.body, completed: 0 }));
      })
    );
    const user = userEvent.setup();
    await act(async () => {
      render(<App />);
    });
    await user.type(screen.getByTestId('title-input'), 'New');
    await user.click(screen.getByTestId('submit-task'));
    await waitFor(() => expect(posted.priority).toBe('P3'));
  });
});
