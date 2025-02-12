import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from 'src/users/enums/role.enum';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<SystemRole[]>('roles', context.getHandler());
        if (!requiredRoles) {
            return true;
        }
    
        const request = context.switchToHttp().getRequest();
    
        if (!request.user) {
            console.error('No se encontró el usuario en la request.');
            return false;
        }
    
        return requiredRoles.some((role) => request.user.systemRole === role);
    }
}