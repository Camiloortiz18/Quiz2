<?php
/**
 * Modelo Student MEJORADO - Gestión avanzada de estudiantes
 * Ubicación: models/Student.php
 * Quiz 2 - Desarrollo Web
 * Incluye: Transacciones, Batch Operations, Filtros avanzados
 */

class Student {
    private $conn;
    private $table_name = "estudiantes";
    
    // Propiedades
    public $id;
    public $nombre;
    public $email;
    public $carrera;
    public $grade;
    public $status;
    public $user_id;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * CREATE - Crear estudiante
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET nombre=:nombre, email=:email, carrera=:carrera, 
                      grade=:grade, status=:status, user_id=:user_id";

        $stmt = $this->conn->prepare($query);

        // Limpiar datos
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->carrera = htmlspecialchars(strip_tags($this->carrera));

        // Vincular parámetros
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":carrera", $this->carrera);
        $stmt->bindParam(":grade", $this->grade);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":user_id", $this->user_id);

        return $stmt->execute();
    }

    /**
     * READ - Obtener todos los estudiantes con filtros opcionales
     * @param array $filters - Filtros: search, status, grade_min, grade_max, carrera
     * @param int $limit - Límite de resultados
     * @param int $offset - Offset para paginación
     */
    public function read($filters = [], $limit = null, $offset = 0) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE 1=1";
        
        // Aplicar filtros
        if(!empty($filters['search'])) {
            $query .= " AND (nombre LIKE :search OR email LIKE :search)";
        }
        if(!empty($filters['status'])) {
            $query .= " AND status = :status";
        }
        if(isset($filters['grade_min'])) {
            $query .= " AND grade >= :grade_min";
        }
        if(isset($filters['grade_max'])) {
            $query .= " AND grade <= :grade_max";
        }
        if(!empty($filters['carrera'])) {
            $query .= " AND carrera = :carrera";
        }
        if(!empty($filters['user_id'])) {
            $query .= " AND user_id = :user_id";
        }
        
        $query .= " ORDER BY created_at DESC";
        
        // Aplicar paginación
        if($limit !== null) {
            $query .= " LIMIT :limit OFFSET :offset";
        }
        
        $stmt = $this->conn->prepare($query);
        
        // Vincular parámetros de filtros
        if(!empty($filters['search'])) {
            $searchParam = "%" . htmlspecialchars(strip_tags($filters['search'])) . "%";
            $stmt->bindParam(":search", $searchParam);
        }
        if(!empty($filters['status'])) {
            $stmt->bindParam(":status", $filters['status']);
        }
        if(isset($filters['grade_min'])) {
            $stmt->bindParam(":grade_min", $filters['grade_min']);
        }
        if(isset($filters['grade_max'])) {
            $stmt->bindParam(":grade_max", $filters['grade_max']);
        }
        if(!empty($filters['carrera'])) {
            $stmt->bindParam(":carrera", $filters['carrera']);
        }
        if(!empty($filters['user_id'])) {
            $stmt->bindParam(":user_id", $filters['user_id']);
        }
        
        // Vincular paginación
        if($limit !== null) {
            $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
            $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        return $stmt;
    }

    /**
     * Contar total de estudiantes (para paginación)
     */
    public function count($filters = []) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE 1=1";
        
        if(!empty($filters['search'])) {
            $query .= " AND (nombre LIKE :search OR email LIKE :search)";
        }
        if(!empty($filters['status'])) {
            $query .= " AND status = :status";
        }
        if(isset($filters['grade_min'])) {
            $query .= " AND grade >= :grade_min";
        }
        if(isset($filters['grade_max'])) {
            $query .= " AND grade <= :grade_max";
        }
        if(!empty($filters['carrera'])) {
            $query .= " AND carrera = :carrera";
        }
        
        $stmt = $this->conn->prepare($query);
        
        if(!empty($filters['search'])) {
            $searchParam = "%" . htmlspecialchars(strip_tags($filters['search'])) . "%";
            $stmt->bindParam(":search", $searchParam);
        }
        if(!empty($filters['status'])) {
            $stmt->bindParam(":status", $filters['status']);
        }
        if(isset($filters['grade_min'])) {
            $stmt->bindParam(":grade_min", $filters['grade_min']);
        }
        if(isset($filters['grade_max'])) {
            $stmt->bindParam(":grade_max", $filters['grade_max']);
        }
        if(!empty($filters['carrera'])) {
            $stmt->bindParam(":carrera", $filters['carrera']);
        }
        
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    /**
     * READ ONE - Obtener estudiante por ID
     */
    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->nombre = $row['nombre'];
            $this->email = $row['email'];
            $this->carrera = $row['carrera'];
            $this->grade = $row['grade'];
            $this->status = $row['status'];
            $this->user_id = $row['user_id'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    /**
     * UPDATE - Actualizar estudiante (con transacción)
     */
    public function update() {
        try {
            // Iniciar transacción
            $this->conn->beginTransaction();
            
            $query = "UPDATE " . $this->table_name . " 
                      SET nombre=:nombre, email=:email, carrera=:carrera, 
                          grade=:grade, status=:status 
                      WHERE id=:id";
            
            $stmt = $this->conn->prepare($query);
            
            // Limpiar datos
            $this->nombre = htmlspecialchars(strip_tags($this->nombre));
            $this->email = htmlspecialchars(strip_tags($this->email));
            $this->carrera = htmlspecialchars(strip_tags($this->carrera));
            $this->id = htmlspecialchars(strip_tags($this->id));
            
            // Calcular status automáticamente basado en grade
            if($this->grade !== null) {
                if($this->grade >= 3.0) {
                    $this->status = 'active';
                } elseif($this->grade < 3.0 && $this->grade > 0) {
                    $this->status = 'inactive';
                }
            }
            
            $stmt->bindParam(":nombre", $this->nombre);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":carrera", $this->carrera);
            $stmt->bindParam(":grade", $this->grade);
            $stmt->bindParam(":status", $this->status);
            $stmt->bindParam(":id", $this->id);
            
            $result = $stmt->execute();
            
            // Commit de la transacción
            $this->conn->commit();
            return $result;
            
        } catch(Exception $e) {
            // Rollback en caso de error
            $this->conn->rollBack();
            throw $e;
        }
    }

    /**
     * DELETE - Eliminar estudiante
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        return $stmt->execute();
    }

    /**
     * BATCH DELETE - Eliminar múltiples estudiantes (con transacción)
     * @param array $ids - Array de IDs a eliminar
     * @return array - Resultado con éxitos y errores
     */
    public function batchDelete($ids) {
        $result = [
            'success' => [],
            'errors' => [],
            'total_deleted' => 0
        ];
        
        try {
            // Iniciar transacción para atomicidad
            $this->conn->beginTransaction();
            
            foreach($ids as $id) {
                $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(1, $id);
                
                if($stmt->execute()) {
                    $result['success'][] = $id;
                    $result['total_deleted']++;
                } else {
                    $result['errors'][] = ['id' => $id, 'error' => 'No se pudo eliminar'];
                }
            }
            
            // Commit de la transacción
            $this->conn->commit();
            return $result;
            
        } catch(Exception $e) {
            // Rollback en caso de error
            $this->conn->rollBack();
            throw $e;
        }
    }

    /**
     * Obtener estadísticas de estudiantes
     * @return array
     */
    public function getStatistics() {
        $query = "SELECT 
                    COUNT(*) as total,
                    AVG(grade) as avg_grade,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count,
                    COUNT(CASE WHEN status = 'graduated' THEN 1 END) as graduated_count
                  FROM " . $this->table_name;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener promedios por status
     * @return array
     */
    public function getAveragesByStatus() {
        $query = "SELECT status, AVG(grade) as avg_grade, COUNT(*) as count 
                  FROM " . $this->table_name . " 
                  WHERE grade IS NOT NULL 
                  GROUP BY status";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>