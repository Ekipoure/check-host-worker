/**
 * Result Storage - Store and retrieve check results using PostgreSQL
 */
import prisma from '../database/prisma';
import { generateRequestId } from '../utils/helpers';

export class ResultStorage {
  async storeResult(
    requestId: string,
    checkType: string,
    host: string,
    nodes: Record<string, string[]>,
    results: Record<string, any>
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire after 24 hours

    try {
      // Create check request
      await prisma.checkRequest.create({
        data: {
          requestId,
          checkType,
          host,
          permanentLink: `${process.env.BASE_URL || 'http://localhost:8000'}/check-report/${requestId}`,
          expiresAt
        }
      });

      // Store results for each node
      for (const [nodeId, resultData] of Object.entries(results)) {
        // Extract agent ID from node ID (e.g., "us1.node.check-host.net" -> "us1")
        const agentId = nodeId.split('.')[0];

        await prisma.checkResult.create({
          data: {
            requestId,
            agentId,
            nodeId,
            resultData: resultData as any,
            status: 'completed'
          }
        });
      }
    } catch (error) {
      console.error('Error storing result:', error);
      throw error;
    }
  }

  async getResult(requestId: string): Promise<any> {
    try {
      const request = await prisma.checkRequest.findUnique({
        where: { requestId },
        include: {
          results: true
        }
      });

      if (!request) {
        return null;
      }

      // Check if expired
      if (new Date() > request.expiresAt) {
        await this.deleteResult(requestId);
        return null;
      }

      // Format results
      const results: Record<string, any> = {};
      for (const result of request.results) {
        results[result.nodeId] = result.resultData;
      }

      return results;
    } catch (error) {
      console.error('Error getting result:', error);
      return null;
    }
  }

  async getExtendedResult(requestId: string): Promise<any> {
    const request = await prisma.checkRequest.findUnique({
      where: { requestId },
      include: {
        results: true
      }
    });

    if (!request) {
      return null;
    }

    // Check if expired
    if (new Date() > request.expiresAt) {
      await this.deleteResult(requestId);
      return null;
    }

    // Format extended results
    const results: Record<string, any> = {};
    for (const result of request.results) {
      results[result.nodeId] = result.resultData;
    }

    return {
      command: request.checkType,
      created: Math.floor(request.createdAt.getTime() / 1000),
      host: request.host,
      results
    };
  }

  async deleteResult(requestId: string): Promise<void> {
    try {
      await prisma.checkRequest.delete({
        where: { requestId }
      });
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  }

  async cleanupExpired(): Promise<void> {
    try {
      const now = new Date();
      await prisma.checkRequest.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired results:', error);
    }
  }
}

