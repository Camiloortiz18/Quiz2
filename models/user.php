<?php
/**
 * Modelo User - Gestión de usuarios y autenticación
 * Ubicación: models/User.php
 * Quiz 2 - Desarrollo Web
 */

class User {
    private $conn;
    private $table_name = "users";
    
    // Propiedades del usuario
    public $id;
    public $username;
    public $password;
    public $email;
    public $role;
    public $created_at;

    /**
     * Constructor - Inicializa la conexión a la base de datos
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * CREATE - Registrar nuevo usuario
     * @return bool - true si se creó exitosamente
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET username=:username, password=:password, email=:email, role=:role";

        $stmt = $this->conn->prepare($query);

        // Limpiar y validar datos
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = htmlspecialchars(strip_tags($this->role));
        
        // Hashear contraseña usando bcrypt
        $hashed_password = password_hash($this->password, PASSWORD_BCRYPT);

        // Vincular parámetros
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":role", $this->role);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * LOGIN - Autenticar usuario
     * @return array|false - Datos del usuario si es válido, false si no
     */
    public function login() {
        $query = "SELECT id, username, password, email, role, created_at 
                  FROM " . $this->table_name . " 
                  WHERE username = :username OR email = :username
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $this->username = htmlspecialchars(strip_tags($this->username));
        $stmt->bindParam(":username", $this->username);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row && password_verify($this->password, $row['password'])) {
            // Contraseña válida - retornar datos del usuario
            $this->id = $row['id'];
            $this->username = $row['username'];
            $this->email = $row['email'];
            $this->role = $row['role'];
            $this->created_at = $row['created_at'];
            return $row;
        }
        
        return false;
    }

    /**
     * READ - Obtener todos los usuarios
     * @return PDOStatement
     */
    public function read() {
        $query = "SELECT id, username, email, role, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * READ ONE - Obtener usuario por ID
     * @return bool
     */
    public function readOne() {
        $query = "SELECT id, username, email, role, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = ? LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->username = $row['username'];
            $this->email = $row['email'];
            $this->role = $row['role'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    /**
     * Verificar si un usuario existe por username
     * @param string $username
     * @return bool
     */
    public function userExists($username) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $username);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    /**
     * Verificar si un email existe
     * @param string $email
     * @return bool
     */
    public function emailExists($email) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    /**
     * UPDATE - Actualizar usuario
     * @return bool
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET email=:email, role=:role 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = htmlspecialchars(strip_tags($this->role));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }

    /**
     * Cambiar contraseña
     * @param string $new_password
     * @return bool
     */
    public function changePassword($new_password) {
        $query = "UPDATE " . $this->table_name . " SET password=:password WHERE id=:id";
        $stmt = $this->conn->prepare($query);
        
        $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
        
        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }

    /**
     * DELETE - Eliminar usuario
     * @return bool
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        return $stmt->execute();
    }
}
?>