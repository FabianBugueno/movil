import { Injectable, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({
  providedIn: 'root'
})
export class Db {
  private _dbInstance: any = null;
  private useWebStorage = false;

  constructor(@Optional() private sqlite: SQLite, router: Router){
    // Intenta crear tablas; si falla (p. ej. en navegador sin plugin), usaremos web storage
    this.crearTablas().catch(e => {
      console.warn('FBP : crearTablas fallo, usando fallback web:', e);
      this.useWebStorage = true;
      // intentar crear tablas en fallback
      this.crearTablas().catch(err => console.error('FBP : crearTablas fallback fallo', err));
    });
  }

  // Abre una conexión DB real (SQLite) o devuelve un emulador basado en localStorage
  private async openDb(): Promise<any> {
    if (this._dbInstance) return this._dbInstance;
    if (this.useWebStorage) {
      this._dbInstance = this.createWebDbEmulator();
      return this._dbInstance;
    }
    try {
      const db = await this.sqlite.create({ name: 'data.db', location: 'default' });
      this._dbInstance = db;
      return db;
    } catch (e) {
      // plugin no disponible (p. ej. navegador) -> usar emulator
      this.useWebStorage = true;
      this._dbInstance = this.createWebDbEmulator();
      return this._dbInstance;
    }
  }

  // Emulador mínimo de DB usando localStorage para su uso en navegador / e2e
  private createWebDbEmulator() {
    const prefix = 'FBP_WEBDB_';

    const readTable = (name: string) => {
      try {
        const raw = localStorage.getItem(prefix + name);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    };

    const writeTable = (name: string, rows: any[]) => {
      try { localStorage.setItem(prefix + name, JSON.stringify(rows)); } catch(e){}
    };

    const parseWhere = (whereClause: string, params: any[]) => {
      // soporta condiciones simples: col = ? [AND col2 = ?]
      if (!whereClause) return () => true;
      const parts = whereClause.split(/and/i).map(p => p.trim());
      return (row: any) => {
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const m = part.match(/(\w+)\s*=\s*\?/);
          if (!m) continue;
          const col = m[1];
          const val = params.shift();
          if (String(row[col]) !== String(val)) return false;
        }
        return true;
      };
    };

    return {
      executeSql: async (sql: string, params: any[] = []) => {
        const s = sql.trim();
        const lower = s.toLowerCase();

        // CREATE TABLE -> aseguramos la tabla (no hace nada si ya existe)
        const createMatch = s.match(/create table if not exists\s+(\w+)/i);
        if (createMatch) {
          const tbl = createMatch[1];
          const rows = readTable(tbl);
          writeTable(tbl, rows || []);
          return { rows: { length: 0, item: (i: number) => null }, rowsAffected: 0 };
        }

        // DELETE FROM table WHERE ... OR without where
        const deleteMatch = s.match(/delete from\s+(\w+)(?:\s+where\s+(.+))?/i);
        if (deleteMatch) {
          const tbl = deleteMatch[1];
          const where = deleteMatch[2];
          let rows = readTable(tbl);
          if (!where) {
            rows = [];
            writeTable(tbl, rows);
            return { rows: { length: 0, item: (i: number) => null }, rowsAffected: 1 };
          }
          const paramsCopy = params.slice();
          const predicate = parseWhere(where, paramsCopy);
          const before = rows.length;
          rows = rows.filter((r: any) => !predicate(r));
          writeTable(tbl, rows);
          return { rows: { length: 0, item: (i: number) => null }, rowsAffected: before - rows.length };
        }

        // INSERT INTO table (cols) VALUES (?, ?, ...)
        const insertMatch = s.match(/insert into\s+(\w+)\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/i);
        if (insertMatch) {
          const tbl = insertMatch[1];
          const cols = insertMatch[2].split(',').map((c: string) => c.trim());
          const rows = readTable(tbl);
          const obj: any = {};
          for (let i = 0; i < cols.length; i++) {
            obj[cols[i]] = params[i];
          }
          rows.push(obj);
          writeTable(tbl, rows);
          return { insertId: obj.id ?? rows.length, rowsAffected: 1, rows: { length: 0, item: (i: number) => null } };
        }

        // SELECT ... FROM table [WHERE ...]
        const selectMatch = s.match(/select\s+(.+)\s+from\s+(\w+)(?:\s+where\s+(.+))?/i);
        if (selectMatch) {
          const cols = selectMatch[1].trim();
          const tbl = selectMatch[2];
          const where = selectMatch[3];
          let rows = readTable(tbl);
          if (where) {
            const paramsCopy = params.slice();
            const predicate = parseWhere(where, paramsCopy);
            rows = rows.filter((r: any) => predicate(r));
          }
          // manejar SELECT count(*) AS alias
          const countMatch = cols.match(/count\(\*\)\s+as\s+(\w+)/i);
          if (countMatch) {
            const alias = countMatch[1];
            const arr = [{ [alias]: rows.length }];
            return { rows: { length: arr.length, item: (i: number) => arr[i] } };
          }
          // si se selecciona una sola columna 'data' devolvemos objetos con 'data'
          if (!cols.includes('*') && cols.split(',').length === 1) {
            const colName = cols;
            const arr = rows.map((r: any) => ({ [colName]: r[colName] }));
            return { rows: { length: arr.length, item: (i: number) => arr[i] } };
          }
          // devolver todos los datos
          return { rows: { length: rows.length, item: (i: number) => rows[i] } };
        }

        // UPDATE table SET ... WHERE ... (simple support for 'SET col = ?' patterns)
        const updateMatch = s.match(/update\s+(\w+)\s+set\s+(.+)\s+where\s+(.+)/i);
        if (updateMatch) {
          const tbl = updateMatch[1];
          const setClause = updateMatch[2];
          const where = updateMatch[3];
          const rows = readTable(tbl);
          const setParts = setClause.split(',').map((p: string) => p.trim());
          const predicate = parseWhere(where, params.slice(setParts.length));
          for (const r of rows) {
            if (predicate(r)) {
              for (let i = 0; i < setParts.length; i++) {
                const m = setParts[i].match(/(\w+)\s*=\s*\?/);
                if (m) r[m[1]] = params[i];
              }
            }
          }
          writeTable(tbl, rows);
          return { rowsAffected: 1, rows: { length: 0, item: (i: number) => null } };
        }

        // Por defecto: no soportado -> devolver vacío
        return { rows: { length: 0, item: (i: number) => null }, rowsAffected: 0 };
      }
    };
  }

  async validarContrasena(usuario: string, contrasena: string): Promise<boolean> {
    try {
      const db = await this.openDb();
      const result = await db.executeSql('SELECT contrasena FROM usuario WHERE idusuario = ?', [usuario]);
      if (result.rows.length > 0) {
        const storedPassword = result.rows.item(0).contrasena;
        return storedPassword === contrasena;
      }
      return false;
    } catch (error) {
      console.error('Error validando contraseña:', error);
      return false;
    }
  }

  async actualizarContrasena(usuario: string, nuevaContrasena: string): Promise<boolean> {
    try {
      const db = await this.openDb();
      await db.executeSql('UPDATE usuario SET contrasena = ? WHERE idusuario = ?', [nuevaContrasena, usuario]);
      return true;
    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      return false;
    }
  }

  async crearTablas(): Promise<any> {
    try {
      const db: any = await this.openDb();
      await db.executeSql('CREATE TABLE IF NOT EXISTS usuario (idusuario VARCHAR(30), nombre VARCHAR(35), apellido VARCHAR(35), correo VARCHAR(75), contrasena VARCHAR(30))', []);
      await db.executeSql('CREATE TABLE IF NOT EXISTS sesion (idusuario VARCHAR(30), contrasena VARCHAR(30))', []);
      await db.executeSql('CREATE TABLE IF NOT EXISTS recovery (idusuario VARCHAR(30), token VARCHAR(100), expires INTEGER)', []);
      await db.executeSql('CREATE TABLE IF NOT EXISTS exercises (id INTEGER PRIMARY KEY, data TEXT)', []);
      console.log('FBP : Tablas creadas/actualizadas correctamente');
      return true;
    } catch (e) {
      console.error('FBP : Error al crear/actualizar tablas: ', e);
      throw e;
    }
  }

  almacenarSesion(usuario: string, contrasena: string): Promise<any> {
    return this.openDb()
      .then((db: any) => db.executeSql('DELETE FROM sesion', [])
        .then(() => db.executeSql('INSERT INTO sesion (idusuario, contrasena) VALUES (?, ?)', [usuario, contrasena])))
      .then(() => {
        console.log('FBP : Sesión almacenada con éxito.');
        return true;
      })
      .catch(e => {
        console.error('FBP : No se pudo almacenar la sesión', e);
        throw e;
      });
  }

  eliminarSesion(): Promise<any> {
    return this.openDb()
      .then((db: any) => db.executeSql('DELETE FROM sesion', []))
      .then(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('idUsuario');
        console.log('FBP : Sesión de BD y localStorage eliminada con éxito.');
        return true;
      })
      .catch(e => {
        console.error('FBP : No se pudo eliminar la sesión', e);
        throw e;
      });
  }

  almacenarUsuario(usuario: string, nombre: string, apellidos: string, correo: string, contrasena: string): Promise<any> {
    return this.openDb()
      .then((db: any) => db.executeSql('SELECT count(*) AS cantidad FROM usuario WHERE idusuario = ?', [usuario])
        .then((res: any) => {
          const cantidad = res.rows.item(0).cantidad;
          if (Number(cantidad) > 0) {
            throw new Error('El usuario ya existe');
          }
          return db.executeSql('INSERT INTO usuario (idusuario, nombre, apellido, correo, contrasena) VALUES (?, ?, ?, ?, ?)', [usuario, nombre, apellidos, correo, contrasena]);
        }))
      .then(() => {
        console.log('FBP : Usuario registrado con éxito.');
        return true;
      })
      .catch(e => {
        console.error('FBP : No se pudo registrar el usuario', e);
        throw e;
      });
  }

  loginUsuario(usuario: string, contrasena: string): Promise<any> {
  return this.openDb()
    .then((db: any) => db.executeSql('SELECT * FROM usuario WHERE idusuario = ? AND contrasena = ?', [usuario, contrasena]))
    .then((data: any) => {
      if (data.rows.length > 0) {
        const usuarioObj = data.rows.item(0);
        return usuarioObj;
      } else {
        return null;
      }
    })
    .catch(e => {
      console.error('FBP : Error en loginUsuario', e);
      throw e;
    });
}

validarSesion(): Promise<any> {
  return this.openDb()
    .then((db: any) => db.executeSql('SELECT * FROM sesion ', []))
    .then((data: any) => {
      if (data.rows.length > 0) {
        const usuario = data.rows.item(0);
        return usuario;
      } else {
        return null;
      }
    })
    .catch(e => {
      console.error('FBP : Error en validarSesion', e);
      throw e;
    });
}

  async getCorreoUsuario(usuario: string): Promise<string | null> {
    try {
      const db = await this.openDb();
      const result = await db.executeSql('SELECT correo FROM usuario WHERE idusuario = ?', [usuario]);
      if (result.rows.length > 0) {
        return result.rows.item(0).correo || null;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo correo de usuario:', error);
      throw error;
    }
  }

  async saveRecoveryToken(usuario: string, token: string, expiresAt: number): Promise<void> {
    try {
      const db = await this.openDb();
      // Remove existing tokens for this user
      await db.executeSql('DELETE FROM recovery WHERE idusuario = ?', [usuario]);
      await db.executeSql('INSERT INTO recovery (idusuario, token, expires) VALUES (?, ?, ?)', [usuario, token, expiresAt]);
    } catch (error) {
      console.error('Error guardando token de recuperación:', error);
      throw error;
    }
  }

  async getUsuarioByToken(token: string): Promise<string | null> {
    try {
      const db = await this.openDb();
      const now = Date.now();
      const res = await db.executeSql('SELECT idusuario, expires FROM recovery WHERE token = ?', [token]);
      if (res.rows.length > 0) {
        const row = res.rows.item(0);
        if (row.expires && Number(row.expires) > now) {
          return row.idusuario;
        } else {
          // expired: remove it
          await db.executeSql('DELETE FROM recovery WHERE token = ?', [token]);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error buscando usuario por token:', error);
      throw error;
    }
  }

  async consumeRecoveryToken(token: string): Promise<void> {
    try {
      const db = await this.openDb();
      await db.executeSql('DELETE FROM recovery WHERE token = ?', [token]);
    } catch (error) {
      console.error('Error eliminando token de recuperación:', error);
      throw error;
    }
  }

  /**
   * Save multiple exercises (replaces existing cache)
   */
  async saveExercises(exercises: any[]): Promise<void> {
    try {
      const db = await this.openDb();
      await db.executeSql('DELETE FROM exercises', []);
      const stmt = 'INSERT INTO exercises (id, data) VALUES (?, ?)';
      for (const ex of exercises) {
        const id = ex?.id ?? null;
        const data = JSON.stringify(ex ?? {});
        if (id != null) {
          await db.executeSql(stmt, [id, data]);
        }
      }
      try {
        // Guardar timestamp de la cache para controlar TTL (uso de localStorage por simplicidad)
        try { localStorage.setItem('exercises_cache_ts', String(Date.now())); } catch(e) { /* ignore */ }
      } catch(e) { /* ignore */ }
    } catch (error) {
      console.error('Error guardando ejercicios en cache:', error);
      throw error;
    }
  }

  async getAllExercises(): Promise<any[]> {
    try {
      const db = await this.openDb();
      const res = await db.executeSql('SELECT data FROM exercises', []);
      const list: any[] = [];
      for (let i = 0; i < res.rows.length; i++) {
        try { list.push(JSON.parse(res.rows.item(i).data)); } catch(e) { /* ignore parse errors */ }
      }
      return list;
    } catch (error) {
      console.error('Error obteniendo ejercicios de cache:', error);
      return [];
    }
  }

  async getExerciseById(id: number | string): Promise<any | null> {
    try {
      const db = await this.openDb();
      const res = await db.executeSql('SELECT data FROM exercises WHERE id = ?', [Number(id)]);
      if (res.rows.length > 0) {
        try { return JSON.parse(res.rows.item(0).data); } catch(e) { return null; }
      }
      return null;
    } catch (error) {
      console.error('Error leyendo ejercicio por id:', error);
      return null;
    }
  }
}
