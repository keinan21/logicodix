import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  handlers: new Map<string, (payload?: unknown) => void>(),
  socket: { connected: false, id: 'test', emit: vi.fn(), on: vi.fn() },
}));
vi.mock('socket.io-client', () => ({ io: () => mock.socket }));
import { useRoom } from '../src/client/socket';
let actions: ReturnType<typeof useRoom>;
function Harness() {
  actions = useRoom();
  return null;
}
const payload = { nickname: 'Uji', animalId: 'penyu', mode: 'quick' } as const;

it('reconnect memakai token rahasia dari server', () => {
  const token = '11111111-0001-4001-8001-000000000001';
  actions.joinQueue(payload);
  mock.handlers.get('session:token')?.({ token });
  mock.handlers.get('disconnect')?.();
  mock.handlers.get('connect')?.();
  expect(mock.socket.emit).toHaveBeenCalledWith('session:resume', { token });
});

beforeEach(() => {
  mock.socket.on.mockImplementation((name, callback) => mock.handlers.set(name, callback));
  renderToStaticMarkup(createElement(Harness));
  actions.reset();
  mock.socket.emit.mockClear();
  mock.socket.connected = false;
});

it('menunda join offline dan mengirim ulang antrean setelah reconnect', () => {
  actions.joinQueue(payload);
  expect(mock.socket.emit).not.toHaveBeenCalled();
  mock.socket.connected = true;
  mock.handlers.get('connect')?.();
  expect(mock.socket.emit).toHaveBeenCalledWith('queue:join', payload);
  mock.handlers.get('disconnect')?.();
  mock.handlers.get('connect')?.();
  expect(mock.socket.emit.mock.calls.filter(([event]) => event === 'queue:join')).toHaveLength(2);
});

it('batal offline menghapus permintaan sehingga reconnect tidak masuk antrean', () => {
  actions.joinQueue(payload);
  actions.leaveQueue();
  mock.socket.connected = true;
  mock.handlers.get('connect')?.();
  expect(mock.socket.emit).not.toHaveBeenCalledWith('queue:join', payload);
});
