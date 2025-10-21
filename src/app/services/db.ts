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

  crearTablas(): Promise<any> {
    return this.sqlite.create({
      name: 'data.db',
      location: 'default'
    })
    .then((db: SQLiteObject) => {
      // Sintaxis correcta de SQLite y uso de 'contrasena' sin 'ñ'
      return db.executeSql(
        'CREATE TABLE IF NOT EXISTS usuario (idusuario VARCHAR(30), nombre VARCHAR(35), apellido VARCHAR(35), correo VARCHAR(75), contrasena VARCHAR(30))',
        []
      );
    })
    .then(() => console.log('FBP : Tabla usuario creada'))
    .catch(e => {
      console.error('FBP : Error al crear base de datos/tabla: ', e);
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
  cambiarContrasena(idUsuario: string, contrasenaActual: string, contrasenaNueva: string): Promise<boolean> {
  return this.sqlite.create({
    name: 'data.db',
    location: 'default'
  })
  .then((db: SQLiteObject) => {
    return db.executeSql(
      'UPDATE usuario SET contrasena = ? WHERE idusuario = ? AND contrasena = ?',
      [contrasenaNueva, idUsuario, contrasenaActual]
    ).then((res) => {
      if (res.rowsAffected > 0) {
        console.log('FBP : Contraseña actualizada con éxito');
        return true;
      } else {
        console.log('FBP : No se encontró el usuario o la contraseña actual es incorrecta');
        return false;
      }
    }).catch(e => {
      console.error('FBP : Error al actualizar la contraseña', e);
      return false;
    });
  })
  .catch(e => {
    console.error('FBP : Error al abrir la base de datos', e);
    return false;
  });
}
}

