import { Cuenta } from '../models/Cuenta.js';
import { Lista } from '../models/lista.js';
import { successResponse } from '../utils/apiResponse.js';

export class AdminController {
  static async listarCuentas(req, res, next) {
    try {
      const cuentas = await Cuenta.findAll();
      return res.status(200).json(
        successResponse({
          message: 'Cuentas obtenidas correctamente',
          data: cuentas,
          meta: { total: cuentas.length },
        })
      );
    } catch (error) {
      return next(error);
    }
  }

  static async listarListas(req, res, next) {
    try {
      const listas = await Lista.findAll({ include: ['cuenta'] });
      return res.status(200).json(
        successResponse({
          message: 'Listas obtenidas correctamente',
          data: listas,
          meta: { total: listas.length },
        })
      );
    } catch (error) {
      return next(error);
    }
  }
}
