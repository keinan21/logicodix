import { describe, it, expect } from 'vitest';
import { checkNickname, uniquifyNickname } from '../src/server/nickname';

describe('nickname', () => {
  it('nickname valid diterima', () => {
    expect(checkNickname('Budi 123')).toEqual({ ok: true, nickname: 'Budi 123' });
  });

  it('terlalu pendek ditolak dengan alasan format', () => {
    expect(checkNickname('a')).toMatchObject({ ok: false });
  });

  it('lebih dari 16 karakter ditolak', () => {
    expect(checkNickname('Budibudibudibudib')).toMatchObject({ ok: false });
  });

  it('karakter non-alfanumerik ditolak', () => {
    expect(checkNickname('Budi!')).toMatchObject({ ok: false });
    expect(checkNickname('Budi_123')).toMatchObject({ ok: false });
  });

  it('kata kasar Inggris ditolak (FR-M02)', () => {
    expect(checkNickname('fuck you')).toEqual({
      ok: false,
      reason: 'Nickname tidak boleh mengandung kata kasar',
    });
  });

  it('kata kasar Indonesia ditolak (FR-M02)', () => {
    expect(checkNickname('bajingan')).toEqual({
      ok: false,
      reason: 'Nickname tidak boleh mengandung kata kasar',
    });
  });

  it('samaran angka Indonesia ditolak', () => {
    expect(checkNickname('k0ntol')).toEqual({
      ok: false,
      reason: 'Nickname tidak boleh mengandung kata kasar',
    });
  });

  it('uniquify: nickname kembar dapat suffix #2, #3 (FR-M04)', () => {
    expect(uniquifyNickname('Budi', [])).toBe('Budi');
    expect(uniquifyNickname('Budi', ['Budi'])).toBe('Budi#2');
    expect(uniquifyNickname('Budi', ['Budi', 'Budi#2'])).toBe('Budi#3');
  });
});
