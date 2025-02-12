import { SetMetadata } from '@nestjs/common';
import { SystemRole } from 'src/users/enums/role.enum';

export const Roles = (...roles: SystemRole[]) => SetMetadata('roles', roles);