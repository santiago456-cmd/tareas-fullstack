import type { NextFunction } from 'express';
import { Cuenta } from '../models/Cuenta.js';
import { Lista } from '../models/lista.js';
import { type ApiRequest, type ApiRes } from '../types/http.js';
import { successResponse } from '../utils/apiResponse.js';

export class AdminController {
  static async listarCuentas(req: ApiRequest, res: ApiRes, next: NextFunction) {
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

  static async listarListas(req: ApiRequest, res: ApiRes, next: NextFunction) {
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
