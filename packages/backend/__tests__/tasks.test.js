const request = require('supertest');
const { app, db } = require('../src/app');

afterAll(() => {
  if (db) db.close();
});

describe('Tasks API', () => {
  let taskId;

  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task', description: 'A test task', due_date: '2025-09-30' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Task');
    expect(res.body.description).toBe('A test task');
    expect(res.body.due_date).toBe('2025-09-30');
    expect(res.body.completed).toBe(0);
    taskId = res.body.id;
  });

  it('should get all tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a single task by id', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(taskId);
  });

  it('should update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Updated Task', description: 'Updated', due_date: '2025-10-01' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Task');
    expect(res.body.description).toBe('Updated');
    expect(res.body.due_date).toBe('2025-10-01');
  });

  it('should mark a task as completed', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(1);
  });

  it('should delete a task', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(204);
  });

  it('should default priority to P3 when not provided', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'No priority' });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('P3');
  });

  it('should store an explicit priority', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Urgent', priority: 'P1' });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('P1');
  });

  it('should reject an invalid priority on create', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Bad', priority: 'P4' });
    expect(res.status).toBe(400);
  });

  it('should update priority and reject invalid values on update', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Edit me' });
    const ok = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ title: 'Edit me', priority: 'P2' });
    expect(ok.status).toBe(200);
    expect(ok.body.priority).toBe('P2');
    const bad = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ title: 'Edit me', priority: 'high' });
    expect(bad.status).toBe(400);
  });

  it('should update only the priority via PUT /:id/priority', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Prioritize me' });
    const res = await request(app)
      .put(`/api/tasks/${created.body.id}/priority`)
      .send({ priority: 'P1' });
    expect(res.status).toBe(200);
    expect(res.body.priority).toBe('P1');
    expect(res.body.title).toBe('Prioritize me');
  });

  it('should reject invalid priority and unknown task on PUT /:id/priority', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Check me' });
    const bad = await request(app)
      .put(`/api/tasks/${created.body.id}/priority`)
      .send({ priority: 'P9' });
    expect(bad.status).toBe(400);
    const missing = await request(app).put('/api/tasks/999999/priority').send({ priority: 'P2' });
    expect(missing.status).toBe(404);
  });
});
