import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({
  providedIn: 'root'
})
export class Db {
  constructor(private sqlite: SQLite, router: Router){
    // Llamo a crearTablas y atrapo el posible error para no romper el constructor
    this.crearTablas().catch(e => console.error('FBP : crearTablas fallo', e));
  }

  async validarContrasena(usuario: string, contrasena: string): Promise<boolean> {
    try {
      const db = await this.sqlite.create({
        name: 'data.db',
        location: 'default'
      });

      const result = await db.executeSql(
        'SELECT contrasena FROM usuario WHERE idusuario = ?',
        [usuario]
      );

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
      const db = await this.sqlite.create({
        name: 'data.db',
        location: 'default'
      });

      await db.executeSql(
        'UPDATE usuario SET contrasena = ? WHERE idusuario = ?',
        [nuevaContrasena, usuario]
      );

      return true;
    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      return false;
    }
  }

  crearTablas(): Promise<any> {

    return this.sqlite.create({
      name: 'data.db',
      location: 'default'
    })
    .then((db: SQLiteObject) => {

      return db.executeSql(
        'CREATE TABLE IF NOT EXISTS usuario (idusuario VARCHAR(30), nombre VARCHAR(35), apellido VARCHAR(35), correo VARCHAR(75), contrasena VARCHAR(30))',
        []
      )

      .then(() => db.executeSql(
        'CREATE TABLE IF NOT EXISTS sesion (idusuario VARCHAR(30), contrasena VARCHAR(30))',
        []
      ));
    })
    .then(() => this.sqlite.create({ name: 'data.db', location: 'default' })
      .then((db: SQLiteObject) => db.executeSql(
        'CREATE TABLE IF NOT EXISTS recovery (idusuario VARCHAR(30), token VARCHAR(100), expires INTEGER)',
        []
      )) )
      .then(() => this.sqlite.create({ name: 'data.db', location: 'default' })
        .then((db: SQLiteObject) => db.executeSql(
          'CREATE TABLE IF NOT EXISTS exercises (id INTEGER PRIMARY KEY, data TEXT)',
          []
        )) )
    .then(() => console.log('FBP : Tablas creadas/actualizadas correctamente'))
    .catch(e => {
      console.error('FBP : Error al crear/actualizar tablas: ', e);
      throw e;
    });
  }

  almacenarSesion(usuario: string, contrasena: string): Promise<any> {
    return this.sqlite.create({
      name: 'data.db',
      location: 'default'
    })
    .then((db: SQLiteObject) => {
     
      return db.executeSql('DELETE FROM sesion', [])
        .then(() => {

          return db.executeSql(
            'INSERT INTO sesion (idusuario, contrasena) VALUES (?, ?)',
            [usuario, contrasena]
          );
        });
    })
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
    return this.sqlite.create({
      name: 'data.db',
      location: 'default'
    })
    .then((db: SQLiteObject) => {
      // Elimina la sesión de la base de datos
      return db.executeSql(
        'DELETE FROM sesion',
        []
      );
    })
    .then(() => {
      // Y también elimina los datos de sesión de localStorage para una limpieza completa
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
    return this.sqlite.create({
      name: 'data.db',
      location: 'default'
    })
    .then((db: SQLiteObject) => {

      return db.executeSql('SELECT count(*) AS cantidad FROM usuario WHERE idusuario = ?', [usuario])
        .then(res => {
          const cantidad = res.rows.item(0).cantidad;
          if (Number(cantidad) > 0) {
            throw new Error('El usuario ya existe');
          }
          return db.executeSql(
            'INSERT INTO usuario (idusuario, nombre, apellido, correo, contrasena) VALUES (?, ?, ?, ?, ?)',
            [usuario, nombre, apellidos, correo, contrasena]
          );
        });
    })
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
  return this.sqlite.create({
    name: 'data.db',
    location: 'default'
  })
  .then((db: SQLiteObject) => {
    return db.executeSql(
      'SELECT * FROM usuario WHERE idusuario = ? AND contrasena = ?',
      [usuario, contrasena]
    );
  })
  .then((data) => {
    if (data.rows.length > 0) {
      const usuario = data.rows.item(0);
      return usuario; // devolvemos el objeto completo
    } else {
      return null; // no encontrado
    }
  })
  .catch(e => {
    console.error('FBP : Error en loginUsuario', e);
    throw e;
  });
}

validarSesion(): Promise<any> {
  return this.sqlite.create({
    name: 'data.db',
    location: 'default'
  })
  .then((db: SQLiteObject) => {
    return db.executeSql(
      'SELECT * FROM sesion ',
      []
    );
  })
  .then((data) => {
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
      const db = await this.sqlite.create({
        name: 'data.db',
        location: 'default'
      });

      const result = await db.executeSql(
        'SELECT correo FROM usuario WHERE idusuario = ?',
        [usuario]
      );

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
      const db = await this.sqlite.create({ name: 'data.db', location: 'default' });
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
      const db = await this.sqlite.create({ name: 'data.db', location: 'default' });
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
      const db = await this.sqlite.create({ name: 'data.db', location: 'default' });
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
      const db = await this.sqlite.create({ name: 'data.db', location: 'default' });
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
      const db = await this.sqlite.create({ name: 'data.db', location: 'default' });
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
      const db = await this.sqlite.create({ name: 'data.db', location: 'default' });
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
