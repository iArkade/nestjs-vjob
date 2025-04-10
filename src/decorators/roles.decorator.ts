import { SetMetadata } from '@nestjs/common';
import { SystemRole } from '../users/enums/role.enum';

export const Roles = (...roles: SystemRole[]) => SetMetadata('roles', roles);