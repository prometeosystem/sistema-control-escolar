import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleInClass } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtPayload } from "./jwt-auth.guard";

export const CLASS_ROLES_KEY = "classRoles";
export const RequireClassRoles = (...roles: RoleInClass[]) =>
  SetMetadata(CLASS_ROLES_KEY, roles);

@Injectable()
export class ClassMemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user?: JwtPayload;
      params: Record<string, string>;
      membership?: { classId: string; roleInClass: RoleInClass };
    }>();

    const user = req.user;
    if (!user) throw new ForbiddenException("No autenticado");

    if (user.role === "ADMIN") {
      return true;
    }

    const classId =
      req.params.classId ??
      req.params.id ??
      (await this.resolveClassIdFromPost(req.params.postId));

    if (!classId) {
      throw new ForbiddenException("Clase no determinada");
    }

    const membership = await this.prisma.classMembership.findUnique({
      where: { classId_userId: { classId, userId: user.sub } },
    });
    if (!membership) {
      throw new ForbiddenException("No pertenecés a esta clase");
    }

    const required = this.reflector.getAllAndOverride<RoleInClass[]>(
      CLASS_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (required?.length && !required.includes(membership.roleInClass)) {
      throw new ForbiddenException("Se requiere rol de profesor en la clase");
    }

    req.membership = {
      classId,
      roleInClass: membership.roleInClass,
    };
    return true;
  }

  private async resolveClassIdFromPost(postId?: string) {
    if (!postId) return undefined;
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("Publicación no encontrada");
    return post.classId;
  }
}
