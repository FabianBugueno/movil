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
      // Primero, borramos cualquier sesión existente para asegurar que solo haya una activa.
      return db.executeSql('DELETE FROM sesion', [])
        .then(() => {
          // Ahora, insertamos la nueva y única sesión.
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
}
