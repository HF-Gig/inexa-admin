import { Box, Button, TextField, Typography, Link, Checkbox, FormControlLabel, Paper, InputAdornment, IconButton, Alert } from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import api from "../../helpers/api";

const SigninSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const Signin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError("");
      const response = await api.post('/auth/admin/signin', {
        email: values.email,
        password: values.password
      });
      
      if (!response.data) {
        setError("Login failed. Please try again.");
        setSubmitting(false);
        return;
      }
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      localStorage.setItem('name', JSON.stringify(response?.data?.data?.user?.first_name));
      
      navigate("/");
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: "linear-gradient(135deg,#282828,#32f)",
        px: { xs: 1, sm: 2, md: 0 },
        py: { xs: 2, sm: 0 },
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 2, sm: 4 },
          width: "100%",
          maxWidth: { xs: '100%', sm: 380, md: 400 },
          minWidth: { xs: 0, sm: 320 },
          height: "fit-content",
          maxHeight: { xs: "calc(100vh - 32px)", sm: "none" },
          overflow: "auto",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box mb={2} width="100%" display="flex" justifyContent="center">
          <img src="/logo.webp" alt="Logo" style={{ height: 36, maxWidth: "100%", objectFit: "contain" }} />
        </Box>
        <Typography variant="h5" fontWeight="bold" mb={0.5} align="center">
          Log in
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} align="center">
          Continue your design journey with Clarity.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Formik
          initialValues={{ email: "", password: "", remember: false }}
          validationSchema={SigninSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting, setFieldValue }) => (
            <Form style={{ width: "100%" }}>
              <Box display="flex" flexDirection="column" gap={2}>
                <Field
                  as={TextField}
                  name="email"
                  label="Email address"
                  type="email"
                  fullWidth
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '14px', sm: '16px' }
                    }
                  }}
                />
                <Box position="relative">
                  <Field
                    as={TextField}
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '14px', sm: '16px' }
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword((show) => !show)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    background: "#181C32",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: { xs: 14, sm: 16 },
                    py: { xs: 1.25, sm: 1.5 },
                    borderRadius: 2,
                    mt: 1,
                    mb: 1,
                    '&:hover': { background: '#23273e' },
                  }}
                  disabled={isSubmitting}
                  fullWidth
                >
                  {isSubmitting ? "Logging in..." : "Log in"}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default Signin;
