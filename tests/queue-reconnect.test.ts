import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  handlers: new Map<string, (payload?: unknown, context?: unknown) => void>(),
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

function currentContext() {
  const join = mock.socket.emit.mock.calls.filter(([event]) => event === 'queue:join').at(-1);
  return { requestId: join?.[1]?.requestId };
}

it('pesan tanpa konteks ditolak dan hasil permintaan aktif tetap diterima', () => {
  mock.socket.connected = true;
  actions.joinQueue(payload);
  mock.handlers.get('race:end')?.({ ranking: [] });
  renderToStaticMarkup(createElement(Harness));
  expect(actions.session.raceEnd).toBeNull();
  mock.handlers.get('race:end')?.({ ranking: [] }, currentContext());
  renderToStaticMarkup(createElement(Harness));
  expect(actions.session.raceEnd).toEqual({ ranking: [] });
});

it('feedback dan evaluasi lama ditolak setelah main ulang', () => {
  mock.socket.connected = true;
  actions.joinQueue(payload);
  const old = currentContext();
  actions.leaveRoom();
  actions.joinQueue(payload);
  mock.handlers.get('race:feedback')?.({ questionIndex: 0, correct: true }, old);
  mock.handlers.get('eval:ready')?.(
    { questions: [], aiSection: null, badge: 'ringkasan-otomatis-bukan-ai' },
    old,
  );
  mock.handlers.get('race:standings')?.({ ranking: [] }, old);
  mock.handlers.get('queue:status')?.({ menungguS: 9, ditemukan: 4 }, old);
  renderToStaticMarkup(createElement(Harness));
  expect(actions.session.feedback).toBeNull();
  expect(actions.session.evaluation).toBeNull();
  expect(actions.session.standings).toBeNull();
  expect(actions.session.found).toBe(0);
});

it('hasil sesi lama tidak terbawa ketika lobby sesi baru diterima', () => {
  mock.socket.connected = true;
  actions.joinQueue(payload);
  const oldContext = currentContext();
  actions.leaveRoom();
  actions.joinQueue(payload);
  const context = currentContext();
  mock.handlers.get('race:end')?.({ ranking: [] }, oldContext);
  mock.handlers.get('room:state')?.(
    {
      roomId: 'new',
      phase: 'lobby',
      participants: [],
      timeLeftS: 0,
      questionIndex: 0,
      activeQuestion: null,
      finishOrder: [],
    },
    context,
  );
  renderToStaticMarkup(createElement(Harness));
  expect(actions.session.state?.roomId).toBe('new');
  expect(actions.session.raceEnd).toBeNull();
});

it('batal lalu antre lagi menolak lobby, token, dan error dari permintaan lama', () => {
  mock.socket.connected = true;
  actions.joinQueue(payload);
  const oldContext = currentContext();
  actions.leaveQueue();
  actions.joinQueue(payload);
  mock.handlers.get('room:state')?.(
    {
      roomId: 'old',
      phase: 'lobby',
      participants: [],
      timeLeftS: 0,
      questionIndex: 0,
      activeQuestion: null,
      finishOrder: [],
    },
    oldContext,
  );
  mock.handlers.get('session:token')?.(
    { token: '11111111-0001-4001-8001-000000000001' },
    oldContext,
  );
  mock.handlers.get('error')?.({ code: 'session-not-found', pesan: 'Sesi lama' }, oldContext);
  renderToStaticMarkup(createElement(Harness));
  expect(actions.session.state).toBeNull();
  expect(actions.session.error).toBeNull();
  mock.socket.emit.mockClear();
  mock.handlers.get('connect')?.();
  expect(mock.socket.emit).toHaveBeenCalledWith('queue:join', expect.objectContaining(payload));
  expect(mock.socket.emit).not.toHaveBeenCalledWith('session:resume', expect.anything());
});

it('reconnect memakai token rahasia dari server', () => {
  const token = '11111111-0001-4001-8001-000000000001';
  mock.socket.connected = true;
  actions.joinQueue(payload);
  const context = currentContext();
  mock.handlers.get('session:token')?.({ token }, context);
  mock.handlers.get('disconnect')?.();
  mock.handlers.get('connect')?.();
  expect(mock.socket.emit).toHaveBeenCalledWith('session:resume', { token, ...context });
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
  expect(mock.socket.emit).toHaveBeenCalledWith('queue:join', expect.objectContaining(payload));
  mock.handlers.get('disconnect')?.();
  mock.handlers.get('connect')?.();
  expect(mock.socket.emit.mock.calls.filter(([event]) => event === 'queue:join')).toHaveLength(2);
});

it('batal offline menghapus permintaan sehingga reconnect tidak masuk antrean', () => {
  actions.joinQueue(payload);
  actions.leaveQueue();
  mock.socket.connected = true;
  mock.handlers.get('connect')?.();
  expect(mock.socket.emit).not.toHaveBeenCalledWith('queue:join', expect.anything());
});
it('audit: batal antre menolak lobby terlambat dari permintaan sebelumnya', () => {
  actions.joinQueue(payload);
  actions.leaveQueue();
  mock.handlers.get('room:state')?.({
    roomId: 'old',
    phase: 'lobby',
    participants: [],
    timeLeftS: 0,
    questionIndex: 0,
    activeQuestion: null,
    finishOrder: [],
  });
  renderToStaticMarkup(createElement(Harness));
  expect(actions.session.state).toBeNull();
});
